import * as React from 'react';
import * as ReactDom from 'react-dom';

import { sp } from "@pnp/sp";


import { Card, CardTitle, CardBody, CardSubtitle } from '@progress/kendo-react-layout';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';
import { Panel, PanelType, PrimaryButton, DefaultButton, Dropdown, TextField, IDropdownOption } from '@fluentui/react';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { ActionStepsComponent } from './ActionStepsComponent';

import { InvoiceActionRequestTypes } from './enums/MyEnums';
import { PersonaComponent } from './PersonaComponent';

const buttonStyles = { root: { marginRight: 8 } };

export interface IRequestApprovalCardComponentProps {
    // Start Request Type Dropdown
    requestType?: InvoiceActionRequestTypes;
    onRequestTypeChange: any;
    requestOptions?: IDropdownOption[]; // key value pair.
    // End Request Type Dropdown

    context: any;

    // Start People Picker
    // Default selected user emails or login names as per https://pnp.github.io/sp-dev-fx-controls-react/controls/PeoplePicker/
    defaultUsers?: string[];
    onPeoplePickerChange?: any;
    // End People Picker

    // Start Textbox 
    onDescriptionChange: any;
    // End Textbox
}
export class RequestApprovalCardComponent extends React.Component<IRequestApprovalCardComponentProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            Users: []
        }
    }

    public render() {
        let defaultSelectOptions = [
            { key: InvoiceActionRequestTypes.DepartmentApprovalRequired, text: InvoiceActionRequestTypes.DepartmentApprovalRequired },
            { key: InvoiceActionRequestTypes.EditRequired, text: InvoiceActionRequestTypes.EditRequired },
            { key: InvoiceActionRequestTypes.AccountantApprovalRequired, text: InvoiceActionRequestTypes.AccountantApprovalRequired },
            { key: InvoiceActionRequestTypes.AccountingClerkApprovalRequired, text: InvoiceActionRequestTypes.AccountingClerkApprovalRequired }
        ];

        return (
            <Card>
                <CardBody>
                    <div style={{ marginBottom: '15px' }}>
                        <Dropdown
                            label="Select Request Type"
                            options={this.props.requestOptions ? this.props.requestOptions : defaultSelectOptions}
                            selectedKey={this.props.requestType ? this.props.requestType : InvoiceActionRequestTypes.DepartmentApprovalRequired}
                            onChange={this.props.onRequestTypeChange}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <Label>* Requires Approval From</Label>
                        {
                            this.props.onPeoplePickerChange
                                ? <PeoplePicker
                                    context={this.props.context}
                                    showtooltip={false}
                                    personSelectionLimit={10}
                                    showHiddenInUI={false}
                                    principalTypes={[PrincipalType.User]}
                                    selectedItems={e => { this.setState({ Users: e }); this.props.onPeoplePickerChange(e); }}
                                    defaultSelectedUsers={this.props.defaultUsers ? this.props.defaultUsers : []}

                                    isRequired={true}
                                />
                                : this.props.defaultUsers
                                    ? this.props.defaultUsers.map(userEMail => {
                                        return <PersonaComponent userEmail={userEMail} />;
                                    })
                                    // onPeoplePickerChange and defaultUsers are missing! 
                                    : <Error>... Something went wrong ...</Error>
                        }
                        {
                            this.state.Users && (this.state.Users.length < 1) &&
                            <Error>Please Select one or more users.</Error>
                        }
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <TextField label="Description" multiline rows={5} onChange={this.props.onDescriptionChange} />
                    </div>
                </CardBody>
            </Card>
        );
    }
}

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
            <PrimaryButton onClick={(e) => this.props.onSave(this.state)} styles={buttonStyles}>Save</PrimaryButton>
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
                <RequestApprovalCardComponent
                    context={this.props.context}
                    onRequestTypeChange={this._RequestTypeChange}
                    onPeoplePickerChange={this._PeoplePickerChange}
                    onDescriptionChange={this._DescriptionChange}
                />
                <Card>
                    <CardBody>
                        <ActionStepsComponent actions={this.props.dataItem.Actions} />
                    </CardBody>
                </Card>
            </Panel>
        );
    }
}