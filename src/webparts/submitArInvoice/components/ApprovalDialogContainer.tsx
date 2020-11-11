import * as React from 'react';
import * as ReactDom from 'react-dom';

import { sp } from "@pnp/sp";


import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Form, FormElement, Field, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardBody, CardSubtitle } from '@progress/kendo-react-layout';
import { filterBy } from '@progress/kendo-data-query';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { TextArea } from '@progress/kendo-react-inputs';
import { Loader } from '@progress/kendo-react-indicators';


import { InvoiceActionResponseStatus } from './enums/MyEnums';
import { MyFinanceGlAccountsComponent, MyFinanceGlAccounts } from './MyFinanceGLAccounts';
import { MyAttachmentComponent } from './MyAttachmentComponent';
import { MyLists } from './enums/MyLists';
import { IInvoiceAction } from './interface/InvoiceItem';
import { SendApprovalResponse } from './MyHelperMethods';
import { ActionResponseComponent } from './ActionResponseComponent';




interface IApprovalDialogContainerState {
    approvalRequest: IInvoiceAction;
    response?: string;
    responseRequired: boolean;
    comment?: string;
    commentRequired: boolean;
    submitFailed: boolean;
}

const formRowStyle = { width: '100%', marginBottom: '3px' }

export class ApprovalDialogContainer extends React.Component<any, IApprovalDialogContainerState> {
    constructor(props) {
        super(props);
        console.log(props);

        this.state = {
            // ! TODO: Check to see if there are any values!!!
            approvalRequest: this.props.dataItem.Actions.filter(y => y.Response_x0020_Status === InvoiceActionResponseStatus.Waiting && y.AssignedToId === this.props.currentUser.Id)[0],
            responseRequired: false,
            commentRequired: false,
            submitFailed: false
        };
    }


    private _allowSubmit = () => {
        return (!this.state.responseRequired && !this.state.commentRequired && this.props.dataItem.AccountDetails.length < 1);
    }

    private _validateSubmit = (): boolean => {
        let output = true;

        console.log('_validateSubmit');
        console.log(this.state);

        if (!this.state.response) {
            output = false;
            this.setState({
                responseRequired: true
            });
        }
        else {
            if (!this.state.comment && this.state.response === InvoiceActionResponseStatus.Denied) {
                output = false;
                this.setState({
                    commentRequired: true
                });
            }
        }

        return output;
    }

    private _onConfirmClick = (e) => {
        // _validateSubmit will apply any warning messages required. 
        if (this._validateSubmit()) {
            console.log('Submit Valid!');
            SendApprovalResponse(this.state.response, this.state.approvalRequest)
                .then(response => {
                    console.log('approval has been submitted');
                })
                .catch(response => {
                    this.setState({
                        submitFailed: true
                    });
                });
        }
    }

    public render() {
        return (
            <Dialog onClose={this.props.cancel} title={this.state.approvalRequest.Request_x0020_Type} minWidth="200px" width="60%" height="80%">
                <div className={'k-card-deck'} style={{ marginBottom: "16px" }}>
                    <Card style={formRowStyle}>
                        <CardBody>
                            <CardTitle><b>Respond</b></CardTitle>
                            {
                                this.props.dataItem.AccountDetails.length < 1 &&
                                <Error>* Please enter a G/L Account</Error>
                            }
                            {
                                this.state.submitFailed &&
                                <Error><span className="k-icon k-i-warning"></span> Could not save your response at this time.  Please try again later.</Error>
                            }
                            <div style={{ paddingBottom: "5px" }}>
                                <DropDownList
                                    data={[InvoiceActionResponseStatus.Approved, InvoiceActionResponseStatus.Denied]}
                                    label="Select Approve or Deny"
                                    onChange={(e) => {
                                        this.setState({
                                            response: e.target.value,
                                            responseRequired: false,
                                            commentRequired: e.target.value === InvoiceActionResponseStatus.Denied
                                        });
                                    }}
                                    required={this.state.responseRequired}
                                />
                                {
                                    this.state.responseRequired &&
                                    <Error>* Select Approve or Deny.</Error>
                                }
                            </div>
                            <div>
                                <TextArea
                                    id={'ApprovalNote'}
                                    style={{ 'width': '100%' }}
                                    onChange={(e) => {
                                        this.setState({
                                            comment: e.value.toString(),
                                            commentRequired: false
                                        });
                                    }}
                                    required={this.state.commentRequired}
                                    placeholder={'Add a comment...'}
                                />
                                {
                                    this.state.commentRequired &&
                                    <Error>* Please enter a reason to reject this invoice.</Error>
                                }
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <div className={'k-card-deck'}>
                    <Card style={{ width: '28%' }}>
                        <CardBody>
                            <CardTitle><b>Request Details</b></CardTitle>
                            <Label>Requested By:</Label>
                            <p>{this.state.approvalRequest && this.state.approvalRequest.Author.EMail}</p>
                            <Label>Date:</Label>
                            <p>{this.state.approvalRequest && this.state.approvalRequest.Created}</p>
                            <Label>Note:</Label>
                            <p>{this.state.approvalRequest.Body}</p>
                        </CardBody>
                    </Card>
                    <Card style={{ width: '70%' }}>
                        <CardBody>
                            <CardTitle><b>Invoice Details</b></CardTitle>
                            <Form
                                onSubmit={(e) => { e.preventDefault(); }}
                                initialValues={{ ...this.props.dataItem }}
                                render={(formRenderProps) => (
                                    <FormElement>
                                        <div style={formRowStyle}>
                                            <Label>Customer</Label>
                                            <div className='row'>
                                                <div className='col-md-6'>
                                                    <Label>Name:</Label>
                                                    <p>{this.props.dataItem.Customer.Customer_x0020_Name}</p>
                                                </div>
                                                <div className='col-md-6'>
                                                    <Label>Details:</Label>
                                                    <p>{this.props.dataItem.Customer.ID ? this.props.dataItem.Customer.WorkAddress : this.props.dataItem.Customer.CustomerDetails}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={formRowStyle}>
                                            <Label>Accounts</Label>
                                            <FieldArray
                                                name="GLAccounts"
                                                component={MyFinanceGlAccountsComponent}
                                                updateAccountDetails={this.props.updateAccountDetails}
                                                productInEdit={this.props.dataItem}
                                                value={this.props.dataItem.AccountDetails}
                                            />
                                        </div>
                                        <div style={formRowStyle}>
                                            <MyAttachmentComponent
                                                id="RelatedAttachments"
                                                cardTitle="Attachments"
                                                productInEdit={this.props.dataItem}
                                                context={this.props.context}
                                                documentLibrary={MyLists["Related Invoice Attachments"]}
                                                onAdd={this.props.onRelatedAttachmentAdd}
                                                onRemove={this.props.onRelatedAttachmentRemove}
                                            />
                                        </div>
                                    </FormElement>
                                )}
                            >
                            </Form>
                        </CardBody>
                    </Card>
                </div>
                <DialogActionsBar>
                    <Button primary={!this.state.submitFailed} icon={!this.state.submitFailed ? 'save' : 'close-outline'}
                        disabled={this._allowSubmit()}
                        onClick={this._onConfirmClick}
                    >
                        Confirm {this.state.response && this.state.response}
                    </Button>
                    <Button onClick={this.props.cancel} icon={'cancel'}>Cancel</Button>
                </DialogActionsBar>
            </Dialog >
        );
    }
}