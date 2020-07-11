
import * as React from 'react';
import { GridCell } from '@progress/kendo-react-grid';

export function MyCommandCell({ edit, remove, add, update, discard, cancel, editField }) {
  return class extends GridCell {
    render() {
      const { dataItem } = this.props;
      const inEdit = dataItem[editField];
      const isNewItem = dataItem.ID === undefined;

      return inEdit ? (
        <td className={this.props.className + " k-command-cell row row-no-gutters"} style={this.props.style}>
          <button
            className="k-button k-grid-save-command col-sm-12"
            onClick={() => isNewItem ? add(dataItem) : update(dataItem)}
          >
            {isNewItem ? 'Add' : 'Update'}
          </button>
          <button
            className="k-button k-grid-cancel-command col-sm-12"
            onClick={() => isNewItem ? discard(dataItem) : cancel(dataItem)}
          >
            {isNewItem ? 'Discard' : 'Cancel'}
          </button>
        </td>
      ) : (
          <td className={this.props.className + " k-command-cell"} style={this.props.style}>
            <button
              className="k-primary k-button k-grid-edit-command col-sm-12"
              onClick={() => edit(dataItem)}
            >
              Edit
                    </button>
            <button
              className="k-button k-grid-remove-command col-sm-12"
              onClick={() => confirm('Confirm deleting: ' + dataItem.ProductName) &&
                remove(dataItem)
              }
            >
              Remove
                    </button>
          </td>
        );
    }
  }
};

