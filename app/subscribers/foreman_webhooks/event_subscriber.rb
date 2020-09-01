# frozen_string_literal: true

module ForemanWebhooks
  class EventSubscriber < ::Foreman::BaseSubscriber
    def call(event)
      Webhook.deliver(event_name: event.name, payload: event.payload)
    end
  end
end
