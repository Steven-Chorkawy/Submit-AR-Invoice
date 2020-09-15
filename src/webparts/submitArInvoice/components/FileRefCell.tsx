import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  GridColumn as Column,
  GridCellProps,
} from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';

// Import my stuff.
import { MyContentTypes } from './enums/MyEnums';


export class FileRefCell extends React.Component<GridCellProps> {

  constructor(props) {
    super(props);
  }

  public render() {
    if (this.props.dataItem.ContentTypeId === MyContentTypes["AR Invoice Document Item"] && this.props.dataItem.ServerRedirectedEmbedUrl) {
      return (<td title={'Click to view invoice.'}>
        <a href={this.props.dataItem.ServerRedirectedEmbedUrl} target='_blank' >
          <Button primary={true} /*icon="hyperlink-open"*/ icon="folder"></Button>
        </a>
      </td>);
    }
    else {
      return (<td title={'Invoice not processed...'}></td>);
    }
  }
}
