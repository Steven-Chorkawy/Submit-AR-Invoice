import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Form, Field, FormElement, FieldArray } from '@progress/kendo-react-form';
import * as MyFormComponents from './MyFormComponents';


export class MyCustomerCardComponent extends React.Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      selectedCustomer: props.selectedCustomer,
      showMore: false
    };
  }

  public componentWillReceiveProps(nextProps) {
    this.setState({ ...nextProps });
  }

  public render() {
    // Nothing is selected.
    if (this.state.selectedCustomer == undefined) {
      return (<div key="0">Select a Customer</div>);
    }
    // Custom value is entered.
    // If id isn't present that means the user has given us a custom value.
    else if (!this.state.selectedCustomer.hasOwnProperty('ID')) {
      return (
        <div>
          <Field
            id={'MiscCustomerDetails'}
            name={'MiscCustomerDetails'}
            label={'Enter Additional Customer Details'}
            component={MyFormComponents.FormInput}
          />
          {/* <textarea
            className={'k-textarea k-autofill'}
            id={'MiscCustomerDetails'}
            name={'MiscCustomerDetails'}
            onChange={this.props.onCustomCustomerChange}
            value={this.state.selectedCustomer.CustomerDetails}
          /> */}
        </div>
      );
    }
    // existing value is selected.
    else {
      return (
        // TODO: Design this better! This is just for the first round of review.
        <Card key={this.state.selectedCustomer.ID} type="info">
          <CardBody>
            <CardTitle>{this.state.selectedCustomer.Customer_x0020_Name}</CardTitle>
            <p>Mailing Address: {this.state.selectedCustomer.WorkAddress}</p>
            {
              this.state.showMore &&
              <div>
                <p>GP Customer ID: {this.state.selectedCustomer.GPCustomerID}</p>
                <p>Contact Name: {this.state.selectedCustomer.Company}</p>
                <p>Email Address: {this.state.selectedCustomer.Email}</p>
                <p>Telephone Number: {this.state.selectedCustomer.WorkPhone}</p>
                <p>Notes: {this.state.selectedCustomer.Comments}</p>
              </div>
            }
          </CardBody>
          <CardActions>
            <span className="k-button k-flat k-primary"
              onClick={(e) => {
                this.setState({
                  showMore: !this.state.showMore
                });
              }}
            >
              {
                this.state.showMore
                  ? 'Hide'
                  : 'Show More'
              }
            </span>
          </CardActions>
        </Card>
      );
    }
  }
}
