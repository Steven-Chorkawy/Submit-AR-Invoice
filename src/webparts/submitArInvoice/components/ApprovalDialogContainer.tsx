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
}

export class ApprovalDialogContainer extends React.Component<any, IApprovalDialogContainerState> {
    constructor(props) {
        super(props);
        console.log(props);

        this.state = {
            // ! TODO: Check to see if there are any values!!!
            approvalRequest: this.props.dataItem.Actions.filter(y => y.Response_x0020_Status === InvoiceActionResponseStatus.Waiting && y.AssignedToId === this.props.currentUser.Id)[0],
            responseRequired: false,
            commentRequired: false
        };
    }


    private _allowSubmit = () => {
        return (!this.state.responseRequired && !this.state.commentRequired && this.props.dataItem.AccountDetails.length < 1)
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

    public render() {
        return (
            <Dialog onClose={this.props.cancel} title={this.state.approvalRequest.Request_x0020_Type} minWidth="200px" width="60%" height="80%">
                {console.log(this.state.approvalRequest)}
                {console.log(this.props.dataItem.RelatedAttachments)}
                <div className={'k-card-deck'} style={{ marginBottom: "16px" }}>
                    <Card style={{ width: '100%' }}>
                        <CardBody>
                            <CardTitle>Respond</CardTitle>
                            {
                                this.props.dataItem.AccountDetails.length < 1 &&
                                <Error>* Please enter a G/L Account</Error>
                            }
                            <div style={{ paddingBottom: "5px" }}>
                                <DropDownList
                                    data={[InvoiceActionResponseStatus.Approved, InvoiceActionResponseStatus.Denied]}
                                    label="Select Approve or Deny"
                                    onChange={(e) => {
                                        this.setState({
                                            response: e.target.value,
                                            responseRequired: false
                                        });
                                    }}
                                    required={this.state.responseRequired}
                                />
                                {this.state.responseRequired && <Error>* Select Approve or Deny.</Error>}
                            </div>
                            <div>
                                <TextArea
                                    // valid={this.state.approvalRequestError}
                                    id={'ApprovalNote'}
                                    // disabled={this.state.approvalRequestError}
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
                                {this.state.commentRequired && <Error>* Please enter a reason to reject this invoice.</Error>}
                            </div>
                        </CardBody>
                    </Card>
                </div>
                <div className={'k-card-deck'}>
                    <Card style={{ width: '28%' }}>
                        <CardBody>
                            <CardTitle>Request Details</CardTitle>
                            <CardSubtitle>{this.state.approvalRequest.Body}</CardSubtitle>
                            <Label>Requested By:</Label>
                            <p>{this.state.approvalRequest && this.state.approvalRequest.Author.EMail}</p>
                            <Label>Date:</Label>
                            <p>{this.state.approvalRequest && this.state.approvalRequest.Created}</p>
                        </CardBody>
                    </Card>
                    <Card style={{ width: '70%' }}>
                        <CardBody>
                            <CardTitle>Invoice Details</CardTitle>
                            <CardSubtitle>Card Subtitle</CardSubtitle>
                            <Form
                                onSubmit={(e) => { e.preventDefault(); }}
                                initialValues={{ ...this.props.dataItem }}
                                render={(formRenderProps) => (
                                    <FormElement>
                                        <div style={{ width: '100%' }}>
                                            <MyAttachmentComponent
                                                id="RelatedAttachments"
                                                cardTitle="Upload Related Attachments"
                                                productInEdit={this.props.dataItem}
                                                context={this.props.context}
                                                documentLibrary={MyLists["Related Invoice Attachments"]}
                                                onAdd={this.props.onRelatedAttachmentAdd}
                                                onRemove={this.props.onRelatedAttachmentRemove}
                                            />
                                        </div>
                                        <div style={{ width: '100%' }}>
                                            <Label>Account Details</Label>
                                            <FieldArray
                                                name="GLAccounts"
                                                component={MyFinanceGlAccountsComponent}
                                                updateAccountDetails={this.props.updateAccountDetails}
                                                productInEdit={this.props.dataItem}
                                                value={this.props.dataItem.AccountDetails}
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
                    <Button primary={true} icon={'save'}
                        disabled={this._allowSubmit()}
                        onClick={(e) => {
                            if (this._validateSubmit()) {
                                console.log('Submit Valid!');
                            }
                            else {
                                console.log('bad submit');
                            }
                        }}
                    >Confirm {this.state.response && this.state.response}</Button>
                    <Button onClick={this.props.cancel} icon={'cancel'}>Cancel</Button>
                </DialogActionsBar>
            </Dialog >
        );
    }
}