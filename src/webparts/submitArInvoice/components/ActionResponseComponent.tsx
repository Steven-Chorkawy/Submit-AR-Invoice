import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { IInvoiceAction } from './interface/MyInterfaces';
import { InvoiceActionResponseStatus } from './enums/MyEnums';

interface IActionResponseComponentProps {
  actions: Array<IInvoiceAction>;
}

interface IMyItemCardRender {
  dataItem: IInvoiceAction;
}

class MyItemCardRender extends React.Component<IMyItemCardRender, any> {
  constructor(props) {
    super(props);

    this.state = {
      showMoreDetails: false
    };
  }

  public onShowMoreDetails = e => {
    this.setState({
      showMoreDetails: !this.state.showMoreDetails
    });
  }

  public render() {
    let item = this.props.dataItem;
    let cardType = '';
    switch (item.Response_x0020_Status) {
      case InvoiceActionResponseStatus.Approved:
        cardType = 'success';
        break;
      case InvoiceActionResponseStatus.Rejected:
      case InvoiceActionResponseStatus.Denied:
        cardType = 'error';
        break;
      default:
        cardType = 'info';
        break;
    }
    return (
      <div className='row p-2 border-bottom align-middle' style={{ margin: 0, marginBottom: '2px' }}>
        <div className='col-sm-12'>
          {item.Response_x0020_Status ?
            (<Card type={cardType}>
              <CardBody>
                <h3>
                  {item.Request_x0020_Type}{item.Created && ` - ${item.Created}`}
                </h3>
                <CardTitle>{item.AssignedTo.EMail} - {item.Response_x0020_Status}</CardTitle>

                {item.Response_x0020_Message && <p>"{item.Response_x0020_Message}"</p>}
                {
                  this.state.showMoreDetails &&
                  <div>
                    <hr style={{ marginBottom: '10px', marginTop: '10px' }} />
                    <p>{item.Response_x0020_Summary}</p>
                  </div>
                }
              </CardBody>
              <CardActions>
                <Button className="k-button k-flat k-primary" onClick={this.onShowMoreDetails}>{this.state.showMoreDetails ? 'Hide' : 'Show'} Details</Button>
              </CardActions>
            </Card>) : (<Card type={cardType}>
              <CardBody>
                <h3>
                  {item.Title}
                  {item.Created && ` - ${item.Created}`}
                </h3>
                <p>Waiting for response from {item.AssignedTo.EMail}</p>
                <p>Request sent on {item.Created}</p>
              </CardBody>
            </Card>)
          }
        </div>
      </div>
    );
  }
}


class ActionResponseComponent extends React.Component<IActionResponseComponentProps, any> {
  constructor(props) {
    super(props);
  }

  private MyItemRender = props => <MyItemCardRender {...props} />;

  public render() {
    return (
      <div>
        <ListView
          style={{ 'maxWidth': '600px' }}
          data={this.props.actions}
          item={this.MyItemRender}
        />
      </div>
    );
  }
}

export { ActionResponseComponent };
