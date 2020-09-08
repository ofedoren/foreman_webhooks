# frozen_string_literal: true

class Webhook < ApplicationRecord
  include Authorizable

  EVENT_POSTFIX = ".#{Foreman::Observable::DEFAULT_NAMESPACE}"

  EVENT_ALLOWLIST = %w[
    host_created host_updated host_destroyed
    hostgroup_created hostgroup_updated hostgroup_destroyed
    user_created user_updated user_destroyed
    domain_created domain_updated domain_destroyed
    subnet_created subnet_updated subnet_destroyed
    build_entered build_exited status_changed
  ].map { |e| e + EVENT_POSTFIX }.freeze

  DEFAULT_PAYLOAD_TEMPLATE = 'Webhook Payload - Payload Default'

  ALLOWED_HTTP_METHODS = %w[POST GET PUT DELETE PATCH].freeze

  attribute :events, :string, array: true, default: []

  validates_lengths_from_database
  validates :name, :target_url, :events, presence: true
  validates :target_url, format: URI.regexp(%w[http https])
  validates :http_method, inclusion: { in: ALLOWED_HTTP_METHODS }

  belongs_to :payload_template, foreign_key: :payload_template_id

  before_save :set_default_template, unless: :payload_template

  scope :for_event, ->(events) { where('events @> ARRAY[?]::varchar[]', Array(events)) }

  def self.available_events
    ::Foreman::EventSubscribers.all_observable_events & EVENT_ALLOWLIST
  end

  def self.deliver(event_name:, payload:)
    for_event(event_name).each do |target|
      target.deliver(event_name: event_name, payload: payload)
    end
  end

  def events=(events)
    events = Array(events).map do |event|
      next event if event.end_with?(EVENT_POSTFIX)

      event.to_s.underscore + EVENT_POSTFIX
    end
    super(self.class.available_events & events)
  end

  def event=(event)
    self.events = event
  end

  def event
    self.events.first
  end

  def deliver(event_name:, payload:)
    payload = rendered_payload(event_name, payload)
    ::ForemanWebhooks::DeliverWebhookJob.perform_later(event_name: event_name, payload: payload, webhook_id: id)
  end

  private

  def set_default_template
    self.payload_template = PayloadTemplate.find_by!(name: DEFAULT_PAYLOAD_TEMPLATE)
  end

  def rendered_payload(event_name, payload)
    self.payload_template.render(
      variables: {
        event_name: event_name,
        payload: payload,
        webhook_id: id
      }
    )
  end
end
