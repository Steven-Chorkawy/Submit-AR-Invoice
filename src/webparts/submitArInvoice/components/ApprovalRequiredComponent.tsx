import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';


//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { MyLists } from './enums/MyLists';


interface IApprovalRequiredComponentProps {
  productInEdit: any;
  currentUser: any;
}

class ApprovalRequiredComponent extends React.Component<IApprovalRequiredComponentProps, any> {
  constructor(props) {
    super(props);

    this.state = {
      productInEdit: props.productInEdit
    };
  }

  public sendApproval = (event) => {
    this.sendApprovalResponse("Approve");
  }

  public sendReject = (event) => {
    this.sendApprovalResponse("Reject");
  }

  //TODO: Pick the correct request instead of the first one.
  // TODO: Update this method so it uses the new list.
  private sendApprovalResponse = (response) => {
    throw 'In the works';
    var comment = this.state.approvalNotes;
    var request = this.state.productInEdit.Approvals.filter(a => a.Users_x0020_Email === this.props.currentUser.Email);
    var updateObj = {
      Response: response,
      Response_x0020_Summary: "Approved from SharePoint Form",
      Response_x0020_Message: comment
    };
    // sp.web.lists.getByTitle(MyLists.ApprovalRequestsSent).items
    //   .getById(request[0].ID)
    //   .update(updateObj)
    //   .then(res => {
    //     request[0] = { ...request[0], ...updateObj };
    //     const index = this.state.productInEdit.Approvals.findIndex(a => a.ID === request[0].ID);
    //     var allRequests = this.state.productInEdit.Approvals;
    //     allRequests[index] = request[0];
    //     this.setState({
    //       productInEdit: {
    //         ...this.state.productInEdit,
    //         Approvals: [...allRequests]
    //       }
    //     });

      //   // trigger a change on the invoice which in turn will trigger a workflow.
      //   sp.web.lists.getByTitle('AR Invoices').items
      //     .getById(request[0].InvoiceID)
      //     .update({
      //       DirtyField: new Date()
      //     });

      // })
      // .catch(error => {
      //   this.setState({
      //     approvalRequestError: true
      //   });
      // });
  }

  public onApprovalDialogInputChange = (event) => {
    let target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = (target.props && target.props.name !== undefined) ? target.props.name : (target.name !== undefined) ? target.name : target.props.id;

    this.setState({
      approvalNotes: value
    });
  }

  public render() {
    return (
      <div>
        {this.state.productInEdit.Approvals && this.state.productInEdit.Approvals.filter(a => a.Users_x0020_Email === this.props.currentUser.Email && a.Response === null).length > 0 &&
          <div>
            <Card style={{ width: 600 }} type={this.state.approvalRequestError ? 'error' : ''}>
              <CardBody>
                <CardTitle><b>Your Response is Required</b></CardTitle>
                <p>Reason (Optional)</p>
                {this.state.approvalRequestError && <h4 className="k-text-error">Something went wrong, cannot send your response at the moment.</h4>}
                <textarea disabled={this.state.approvalRequestError} style={{ width: '100%' }} id={'ApprovalNote'} onChange={this.onApprovalDialogInputChange}></textarea>
              </CardBody>
              <CardActions className="row">
                <Button className="k-text-success col-sm-6" icon="check" disabled={this.state.approvalRequestError} onClick={this.sendApproval}>Approve</Button>
                <Button className="k-text-error col-sm-6" icon="close" disabled={this.state.approvalRequestError} onClick={this.sendReject}>Reject</Button>
              </CardActions>
            </Card>
            <hr />
          </div>
        }
      </div>
    );
  }
}


export { ApprovalRequiredComponent };
