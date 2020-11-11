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
        this.state = {
            Request_x0020_Type: InvoiceActionRequestTypes.DepartmentApprovalRequired,
            Users: []
        };
    }

    private _PeoplePickerChange = (e) => {
        this.setState({
            Users: []
        });
        for (let index = 0; index < e.length; index++) {
            const element = e[index];
            sp.web.siteUsers.getByLoginName(element.loginName).get()
                .then(response => {
                    this.setState({
                        Users: [...this.state.Users, response]
                    });
                });
        }
    }

    private _RequestTypeChange = (option, index) => {
        this.setState({
            Request_x0020_Type: index.key
        });
    }

    private _DescriptionChange = (event, newValue) => {
        this.setState({
            Description: newValue
        });
    }

    //#region Render Methods
    private onRenderFooterContent = (props) => (
        <div>
            <PrimaryButton onClick={(e) => {
                this.props.onSave(this.state);
            }} styles={buttonStyles}>Save</PrimaryButton>
            <DefaultButton onClick={this.props.onDismiss}>Cancel</DefaultButton>
        </div>
    )
    //#endregion



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
                                selectedKey={this.state.Request_x0020_Type}
                                onChange={this._RequestTypeChange}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <Label>* Requires Approval From</Label>
                            <PeoplePicker
                                context={this.props.context}
                                showtooltip={false}
                                personSelectionLimit={10}
                                showHiddenInUI={false}
                                principalTypes={[PrincipalType.User]}
                                selectedItems={this._PeoplePickerChange}
                                isRequired={true}
                            />
                            {
                                this.state.Users && (this.state.Users.length < 1) &&
                                <Error>Please Select one or more users.</Error>
                            }
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <TextField label="Description" multiline rows={5} onChange={this._DescriptionChange} />
                        </div>
                    </CardBody>
                </Card>
            </Panel>
        );
    }
}