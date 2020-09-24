import * as React from 'react';
import * as ReactDom from 'react-dom';
import {
  GridColumn as Column,
  GridCellProps
} from '@progress/kendo-react-grid';

class IDCell extends React.Component<GridCellProps> {
  constructor(props) {
    super(props);
  }

  public render() {
    const style = {
      backgroundColor: '#fffceb',
      color: '#857d52'
    };

    return (
      <td role={'gridcell'}
        style={this.props.dataItem.Urgent ? style : {}}
        title={this.props.dataItem.Urgent && 'Urgent Invoice!'}
      >
        {
          this.props.dataItem.Urgent &&
          <span className="k-icon k-i-warning"></span>
        }
        <span>{this.props.dataItem.ID}</span>
      </td>
    );
  }
}

export { IDCell };
