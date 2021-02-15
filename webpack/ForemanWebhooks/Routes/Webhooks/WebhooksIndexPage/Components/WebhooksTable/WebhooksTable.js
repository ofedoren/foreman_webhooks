import React from 'react';
import PropTypes from 'prop-types';

import { translate as __ } from 'foremanReact/common/I18n';
import { Table } from 'foremanReact/components/common/table';
import Pagination from 'foremanReact/components/Pagination/PaginationWrapper';
import { withRenderHandler } from 'foremanReact/common/HOC';
import { useForemanModal } from 'foremanReact/components/ForemanModal/ForemanModalHooks';

import WebhookDeleteModal from '../WebhookDeleteModal';
import WebhookEditModal from '../WebhookEditModal';
import EmptyWebhooksTable from '../EmptyWebhooksTable';

import createWebhooksTableSchema from './WebhooksTableSchema';

import { WEBHOOK_EDIT_MODAL_ID } from '../../../constants';

const WebhooksTable = ({
  fetchAndPush,
  itemCount,
  results,
  sort,
  pagination,
  toDelete,
  onDeleteClick,
  toEdit,
  onEditClick,
  message,
  reloadWithSearch,
  search,
}) => {
  const onDeleteSuccess = () => {
    const currentPage = pagination.page;
    const maxPage = Math.ceil((itemCount - 1) / pagination.perPage);
    fetchAndPush({ page: maxPage < currentPage ? maxPage : currentPage });
  };

  const { setModalClosed: setEditModalClosed } = useForemanModal({
    id: WEBHOOK_EDIT_MODAL_ID,
  });

  return (
    <React.Fragment>
      <WebhookDeleteModal toDelete={toDelete} onSuccess={onDeleteSuccess} />
      <WebhookEditModal
        toEdit={toEdit}
        onSuccess={() => {
          setEditModalClosed();
          reloadWithSearch(search);
        }}
        onCancel={setEditModalClosed}
      />
      <Table
        key="webhooks-table"
        columns={createWebhooksTableSchema(
          fetchAndPush,
          sort.by,
          sort.order,
          onDeleteClick,
          onEditClick
        )}
        rows={results}
        id="webhooks-table"
        style={{ marginBottom: -6 }}
      />
      <Pagination
        viewType="list"
        itemCount={itemCount}
        pagination={pagination}
        onChange={fetchAndPush}
        dropdownButtonId="webhooks-page-pagination-dropdown"
      />
    </React.Fragment>
  );
};

WebhooksTable.propTypes = {
  results: PropTypes.array.isRequired,
  fetchAndPush: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  onEditClick: PropTypes.func.isRequired,
  itemCount: PropTypes.number.isRequired,
  sort: PropTypes.object,
  pagination: PropTypes.object.isRequired,
  toDelete: PropTypes.object.isRequired,
  toEdit: PropTypes.number.isRequired,
  message: PropTypes.object,
  reloadWithSearch: PropTypes.func.isRequired,
  search: PropTypes.string,
};

WebhooksTable.defaultProps = {
  sort: { by: '', order: '' },
  search: '',
  message: { type: 'empty', text: __('Try to create a new Webhook') },
};

export default withRenderHandler({
  Component: WebhooksTable,
  EmptyComponent: EmptyWebhooksTable,
  ErrorComponent: EmptyWebhooksTable,
});
