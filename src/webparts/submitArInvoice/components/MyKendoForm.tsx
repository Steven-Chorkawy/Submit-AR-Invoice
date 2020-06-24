import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Form, Field, FormElement } from '@progress/kendo-react-form';
import { Error } from '@progress/kendo-react-labels';
import { Input } from '@progress/kendo-react-inputs'

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';


export class MyForm extends React.Component {
  /**
   *
   */
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div>
        <h1>Hello World! This is my form.</h1>
      </div>
    )
  }

}
