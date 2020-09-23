import * as React from 'react';
import * as ReactDom from 'react-dom';
import { TextArea } from '@progress/kendo-react-inputs';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';

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
import { InvoiceActionResponseStatus } from './enums/MyEnums';
import { FieldWrapper } from '@progress/kendo-react-form';


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
  approvalNotesRequired: boolean;
  approvalRequestError?;
  noAccountPresent: boolean; // An approval can only be sent if this invoice has 1 or more GL/Account Codes.
}

class ApprovalRequiredComponent extends React.Component<IApprovalRequiredComponentProps, IApprovalRequiredComponentState> {
  constructor(props) {
    super(props);
    this.state = {
      action: props.action,
      approvalNotesRequired: false,
      productInEdit: props.productInEdit,
      // An approval can only be sent if this invoice has 1 or more GL/Account Codes.
      noAccountPresent: this._checkForAccounts()
    };
  }

  componentWillReceiveProps(nextProps, nextState) {
    this.setState({
      noAccountPresent: this._checkForAccounts()
    });
  }

  private _checkForAccounts = (): boolean => {
    return !(this.props.productInEdit.AccountDetails && this.props.productInEdit.AccountDetails.length > 0);
  }

  public sendApproval = (event) => {
    // When noAccountPresent === false that means one or more accounts are present.
    if (!this.state.noAccountPresent) {
      this.setState({
        approvalNotesRequired: false
      });
      this.sendApprovalResponse(InvoiceActionResponseStatus.Approved);
    }
  }

  public sendReject = (event) => {
    if (this.state.approvalNotes) {
      this.sendApprovalResponse(InvoiceActionResponseStatus.Denied);
    }
    else {
      this.setState({
        approvalNotesRequired: true
      });
    }
  }

  private sendApprovalResponse = (response) => {
    var comment = this.state.approvalNotes;

    // * This is where an Approvals Response Summary is sent.
    // TODO: Beef up what details are provided in the Response Summary.
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
    this.setState({
      approvalNotes: event.value
    });
  }

  public render() {
    return (
      <FieldWrapper>
        <Card style={{ width: 600 }} type={this.state.approvalRequestError ? 'error' : ''}>
          <CardBody>
            {/* <CardTitle><b>Your Response is Required</b></CardTitle> */}
            {/* <p>{this.state.action.Author.Title} - {this.state.action.Created}</p> */}
            <p>{this.state.action.Body}</p>
            <hr />
            <Label>Send Response:</Label>
            <div className={'k-form-field-wrap'}>
              <TextArea
                valid={this.state.approvalRequestError}
                id={'ApprovalNote'}
                disabled={this.state.approvalRequestError}
                style={{ 'width': '100%' }}
                onChange={this.onApprovalDialogInputChange}
              />
            </div>
            <Hint>Hint text goes here as well.</Hint>

            {
              this.state.noAccountPresent &&
              <Card type='error'>
                <CardBody>
                  <p>Cannot Approve.</p>
                  <p>Please enter a G/L Account</p>
                </CardBody>
              </Card>
            }
            {
              this.state.approvalRequestError &&
              <Card type='error'>
                <CardBody>
                  <p>Something went wrong, cannot send your response at the moment.</p>
                </CardBody>
              </Card>
            }
            {
              this.state.approvalNotesRequired &&
              <Card type='error'>
                <CardBody>
                  <p>* Please enter a reason to reject this invoice.</p>
                </CardBody>
              </Card>
            }
          </CardBody>
          <CardActions className="row">
            <Button className="k-text-success col-sm-6" icon="check"
              disabled={this.state.approvalRequestError || this.state.noAccountPresent}
              onClick={this.sendApproval}>Approve</Button>
            <Button className="k-text-error col-sm-6" icon="close"
              disabled={this.state.approvalRequestError}
              onClick={this.sendReject}>Reject</Button>
          </CardActions>
        </Card>
      </FieldWrapper>
    );
  }
}


export { ApprovalRequiredComponent };
