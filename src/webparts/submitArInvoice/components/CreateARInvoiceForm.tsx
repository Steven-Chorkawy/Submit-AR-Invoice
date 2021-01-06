import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { filterBy } from '@progress/kendo-data-query';
import { Label } from '@progress/kendo-react-labels';

// PNP Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/profiles";

// Office UI Imports
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Shimmer } from 'office-ui-fabric-react/lib/Shimmer';

// My custom imports
import * as MyFormComponents from './MyFormComponents';
import { IUploadingFile } from './IMyFormState';
import * as MyValidators from './validators.jsx';
import { MyGLAccountComponent } from './MyGLAccountComponent';

import { BuildGUID, GetUserByEmail, GetUserById, GetUserByLoginName, GetUsersByLoginName, GetUserProfile, GetDepartments } from './MyHelperMethods';

import './PersonaComponent';

export interface ICreateARInvoiceFormProps {
    siteUsers: any;
    customerList: any;
    context: any;
}


export class CreateARInvoiceForm extends React.Component<ICreateARInvoiceFormProps, any> {

    constructor(props) {
        super(props);

        // Current user will be used to set default values on the form. 
        sp.web.currentUser.get().then(user => {
            GetUserProfile(user.LoginName, e => {
                this.setState({
                    currentUser: e
                });
            });
        });
    }

    //#region Form Submit Method
    private handleSubmit = (dataItem) => alert(JSON.stringify(dataItem));
    //#endregion


    public render() {
        return (
            <Form
                initialValues={{
                    Date: new Date(),
                    Urgent: false,
                    StandardTerms: 'NET 30, 1% INTEREST CHARGED',
                    GLAccounts: [],
                    Department: this.state.currentUser && this.state.currentUser.Props['SPS-Department']
                }}
                onSubmit={this.handleSubmit}
                render={(formRenderProps) => (
                    <FormElement>
                        {/* <FieldArray
                            name="users"
                            component={FormGrid}
                            validator={arrayLengthValidator}
                        /> */}
                        <div className="k-form-buttons">
                            <button
                                type={'submit'}
                                className="k-button"
                                disabled={!formRenderProps.allowSubmit}
                            >
                                Submit
                    </button>
                        </div>
                    </FormElement>
                )}
            />
        );
    }
}

