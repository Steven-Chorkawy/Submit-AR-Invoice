import * as React from 'react';
import * as ReactDom from 'react-dom';

import { sp } from "@pnp/sp";


import { Card, CardTitle, CardBody, CardSubtitle } from '@progress/kendo-react-layout';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';
import { Panel, PanelType, PrimaryButton, DefaultButton, Dropdown, TextField } from '@fluentui/react';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";

import { InvoiceActionRequestTypes } from './enums/MyEnums';

const buttonStyles = { root: { marginRight: 8 } };

export class RequestApprovalDialogComponent extends React.Component<any, any> {
    constructor(props) {
        super(props);
        console.log(props);
    }

    private onRenderFooterContent = () => (
        <div>
            <PrimaryButton onClick={this.props.onDismiss} styles={buttonStyles}>Save</PrimaryButton>
            <DefaultButton onClick={this.props.onDismiss}>Cancel</DefaultButton>
        </div>
    );

    public render() {
        return (
            <Panel
                isOpen={true}
                onDismiss={this.props.onDismiss}
                type={PanelType.medium}
                closeButtonAriaLabel="Close"
                headerText="Request Approval for Invoice"
                onRenderFooterContent={this.onRenderFooterContent}
                isFooterAtBottom={true}
            >
                <Card>
                    <CardBody>
                        <div style={{ marginBottom: '15px' }}>
                            <Dropdown
                                label="Select Request Type"
                                options={[
                                    { key: InvoiceActionRequestTypes.DepartmentApprovalRequired, text: InvoiceActionRequestTypes.DepartmentApprovalRequired },
                                    { key: InvoiceActionRequestTypes.EditRequired, text: InvoiceActionRequestTypes.EditRequired },
                                    { key: InvoiceActionRequestTypes.AccountantApprovalRequired, text: InvoiceActionRequestTypes.AccountantApprovalRequired },
                                    { key: InvoiceActionRequestTypes.AccountingClerkApprovalRequired, text: InvoiceActionRequestTypes.AccountingClerkApprovalRequired }
                                ]}
                                selectedKey={InvoiceActionRequestTypes.DepartmentApprovalRequired}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <Label>* Requires Approval From</Label>
                            <PeoplePicker
                                context={this.props.context}
                                showtooltip={false}
                                isRequired={true}
                                personSelectionLimit={10}
                                showHiddenInUI={false}
                                principalTypes={[PrincipalType.User]}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <TextField label="Notes" multiline rows={5} />
                        </div>
                    </CardBody>
                </Card>
            </Panel>
        );
    }
}