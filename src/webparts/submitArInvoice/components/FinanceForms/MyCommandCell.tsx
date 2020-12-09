
import * as React from 'react';
import { GridCell } from '@progress/kendo-react-grid';

import { Button } from '@progress/kendo-react-buttons';
import { InvoiceActionResponseStatus } from '../enums/MyEnums';

export function MyCommandCell({ edit, remove, add, update, discard, cancel, editField, currentUser, approvalResponse }) {
  return class extends GridCell {
    public render() {
      const { dataItem } = this.props;
      const inEdit = dataItem[editField];
      const isNewItem = dataItem.ID === undefined;
      const needsApproval: Boolean = dataItem.Actions.some(y => y.Response_x0020_Status === InvoiceActionResponseStatus.Waiting && y.AssignedToId === currentUser.Id);


      return inEdit ? (
        <td className={this.props.className + " k-command-cell row row-no-gutters"} style={this.props.style}>
          <Button
            className="k-button k-grid-save-command col-sm-12"
            icon="save"
            onClick={() => isNewItem ? add(dataItem) : update(dataItem)}
          >
            {isNewItem ? 'Add' : 'Save'}
          </Button>
          <Button
            className="k-button k-grid-cancel-command col-sm-12"
            icon="cancel"
            onClick={() => isNewItem ? discard(dataItem) : cancel(dataItem)}
          >
            {isNewItem ? 'Discard' : 'Cancel'}
          </Button>
        </td>
      ) : (
          <td className={this.props.className + " k-command-cell"} style={this.props.style}>
            <Button
              className="k-grid-edit-command col-sm-12"
              onClick={() => edit(dataItem)}
              icon="edit"
              look='flat'
              style={{ "marginBottom": "5px" }}
            >Edit</Button>
            {
              needsApproval &&
              <Button
                primary={true}
                className="k-grid-edit-command col-sm-12"
                onClick={() => approvalResponse(dataItem)}
                style={{ "marginBottom": "5px" }}
              >Approve/Deny</Button>
            }
          </td>
        );
    }
  };
}
