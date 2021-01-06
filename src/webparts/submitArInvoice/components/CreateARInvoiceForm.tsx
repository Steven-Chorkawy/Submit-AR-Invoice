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

export interface IMyFormProps {
  siteUsers: any;
  customerList: any;
  context: any;
}

export class CreateARInvoiceForm extends React.Component<IMyFormProps, any> {

  constructor(props) {
    super(props);  
  }


  public render() {
    return (
      <h1>Submit Form here.</h1>
    );
  }
}

