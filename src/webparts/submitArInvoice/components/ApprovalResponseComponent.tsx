import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';


class MyItemCardRender extends React.Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      showMoreDetails: false
    }
  }

  public onShowMoreDetails = (e) => {
    this.setState({
      showMoreDetails: !this.state.showMoreDetails
    });
  }

  render() {

    console.log("MyItemRender");
    console.log(this.props);
    let item = this.props.dataItem;
    let cardType = '';
    switch (item.Response) {
      case 'Approve':
        cardType = 'success';
        break;
      case 'Reject':
        cardType = 'error';
        break;
      default:
        cardType = 'info';
        break;
    }
    return (
      <div className='row p-2 border-bottom align-middle' style={{ margin: 0, marginBottom: '2px' }}>
        <div className='col-sm-12'>
          {item.Response ?
            (<Card type={cardType}>
              <CardBody>
                <h3>
                  {item.Title}
                  {item.Date_x0020_Received && ` - ${item.Date_x0020_Received}`}
                </h3>
                <CardTitle>{item.Users_x0020_Email} - {item.Response}</CardTitle>

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
                {item.Date_x0020_Received && ` - ${item.Date_x0020_Received}`}
              </h3>
              <p>Waiting for response from {item.Users_x0020_Email}</p>
              <p>Request sent on {item.Created}</p>
            </CardBody>
          </Card>)
        }

        </div>
      </div>
    );
  }
}

class ApprovalResponseComponent extends React.Component<any, any> {
  constructor(props) {
    super(props);
  }


  MyItemRender = props => <MyItemCardRender {...props} />


  public render() {
    return (
      <div>
        <ListView
          style={{ 'maxWidth': '600px' }}
          data={this.props.approvals}
          item={this.MyItemRender}
        />
      </div>
    );
  }
}


export { ApprovalResponseComponent }
