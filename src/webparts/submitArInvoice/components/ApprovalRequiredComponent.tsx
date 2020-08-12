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
import { IInvoiceItem, IInvoiceAction } from './interface/InvoiceItem';
import { InvoiceActionRequiredResponseStatus } from './interface/IInvoiceActionRequired';
import { InvoiceActionResponseStatus } from './enums/MyEnums';


interface IApprovalRequiredComponentProps {
  action: IInvoiceAction;
  productInEdit: IInvoiceItem;
  currentUser: any;
  onActionSentCallBack: any;
}

interface IApprovalRequiredComponentState {
  action: IInvoiceAction;
  productInEdit: IInvoiceItem;
  approvalNotes?;
  approvalRequestError?;
}

class ApprovalRequiredComponent extends React.Component<IApprovalRequiredComponentProps, IApprovalRequiredComponentState> {
  constructor(props) {
    super(props);
    this.state = {
      action: props.action,
      productInEdit: props.productInEdit
    };
  }

  public sendApproval = (event) => {

    this.sendApprovalResponse(InvoiceActionResponseStatus.Approved);
  }

  public sendReject = (event) => {

    this.sendApprovalResponse(InvoiceActionRequiredResponseStatus.Denied);
  }


  private sendApprovalResponse = (response) => {

    var comment = this.state.approvalNotes;

    var updateObj = {
      Response_x0020_Status: response,
      Response_x0020_Summary: "Approved from SharePoint Form",
      Response_x0020_Message: comment
    };

    sp.web.lists.getByTitle(MyLists.InvoiceActionRequired).items
      .getById(this.state.action.Id)
      .update(updateObj)
      .then(res => {

        var updated = { ...this.state.action, ...updateObj };


        const index = this.state.productInEdit.Actions.findIndex(a => a.ID === this.state.action.ID);
        var allRequests = this.state.productInEdit.Actions;
        allRequests[index] = updated;
        this.setState({
          productInEdit: {
            ...this.state.productInEdit,
            Actions: [...allRequests],
            DirtyField: new Date(),
          }
        });

        // Only update the invoice item if one is present.
        if (this.state.action.AR_x0020_InvoiceId !== null) {
          sp.web.lists.getByTitle(MyLists["AR Invoices"]).items
            .getById(this.state.action.AR_x0020_InvoiceId)
            .update({
              DirtyField: new Date()
            });
        }

        // trigger a change on the invoice which in turn will trigger a workflow.
        sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).items
          .getById(this.state.action.AR_x0020_Invoice_x0020_RequestId)
          .update({
            DirtyField: new Date()
          });


        // This will close the edit form after a response is sent as per Finance.
        this.props.onActionSentCallBack();

      })
      .catch(error => {

        this.setState({
          approvalRequestError: true
        });
      });
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
        <Card style={{ width: 600 }} type={this.state.approvalRequestError ? 'error' : ''}>
          <CardBody>
            <CardTitle><b>Your Response is Required</b></CardTitle>
            <p>From: {this.state.action.Author.Title} - {this.state.action.Created}</p>
            <p>"{this.state.action.Body}"</p>
            <hr />
            <p>Your Response</p>
            {this.state.approvalRequestError && <h4 className="k-text-error">Something went wrong, cannot send your response at the moment.</h4>}
            <textarea disabled={this.state.approvalRequestError} style={{ width: '100%' }} id={'ApprovalNote'} onChange={this.onApprovalDialogInputChange}></textarea>
          </CardBody>
          <CardActions className="row">
            <Button className="k-text-success col-sm-6" icon="check" disabled={this.state.approvalRequestError} onClick={this.sendApproval}>Approve</Button>
            <Button className="k-text-error col-sm-6" icon="close" disabled={this.state.approvalRequestError} onClick={this.sendReject}>Reject</Button>
          </CardActions>
        </Card>
      </div>
    );
  }
}


export { ApprovalRequiredComponent };
