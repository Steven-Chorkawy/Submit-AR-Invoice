
import * as React from 'react';
import { GridCell } from '@progress/kendo-react-grid';

import { Button } from '@progress/kendo-react-buttons';

export function MyCommandCell({ edit, remove, add, update, discard, cancel, editField }) {
  return class extends GridCell {
    render() {
      const { dataItem } = this.props;
      const inEdit = dataItem[editField];
      const isNewItem = dataItem.ID === undefined;

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
              className="k-primary k-button k-grid-edit-command col-sm-12"
              onClick={() => edit(dataItem)}
              icon="edit"
              style={{ "marginBottom": "5px" }}
            >Edit</Button>
            {/* <Button
              className="k-button k-grid-remove-command col-sm-12"
              onClick={() => confirm('Confirm deleting: ' + dataItem.ProductName) &&
                remove(dataItem)
              }
              icon="delete"
              style={{ "marginBottom": "5px" }}
            >Delete</Button> */}
          </td>
        );
    }
  }
};

