import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Field } from '@progress/kendo-react-form';
import { NumericTextBox, Checkbox } from '@progress/kendo-react-inputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Label, Error, Hint, FloatingLabel } from '@progress/kendo-react-labels';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';

import * as MyValidators from './validators.jsx';
import * as MyFormComponents from './MyFormComponents';


export class MyRelatedAttachmentComponent extends React.Component<any, any> {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Card style={{ width: 400 }}>
        <CardBody>
          <CardTitle>Related Attachments</CardTitle>
          {
            this.props.productInEdit.RelatedAttachments.map(f => {
              return (
                <a target='_blank' href={f.ServerRedirectedEmbedUrl} style={{ margin: '2px' }}>
                  <div className='k-chip k-chip-filled k-chip-info'>
                    <div className='k-chip-content'>
                      {f.Title}
                    </div>
                  </div>
                </a>
              );
            })
          }
          <hr />
          <Field
            id="RelatedInvoiceAttachments"
            name="RelatedInvoiceAttachments"
            label="Upload Related Attachments"
            batch={false}
            multiple={true}
            component={MyFormComponents.FormUpload}
            myOnChange={this.props.onChange}
          />
        </CardBody>
      </Card>
    );
  }
}
