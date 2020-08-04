import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';


export class MyCustomerCardComponent extends React.Component<any, any> {

  /**
   *
   */
  constructor(props) {
    super(props);
    this.state = {
      selectedCustomer: props.selectedCustomer
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
          <div>
            <b>Enter Additional Customer Details.</b>
          </div>
          <textarea
            className={'k-textarea k-autofill'}
            id={'MiscCustomerDetails'}
            name={'MiscCustomerDetails'}
            onChange={this.props.onCustomCustomerChange}
            value={this.state.selectedCustomer.CustomerDetails}
          />
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
            <p>GP Customer ID: {this.state.selectedCustomer.GPCustomerID}</p>
            <p>Contact Name: {this.state.selectedCustomer.Company}</p>
            <p>Email Address: {this.state.selectedCustomer.Email}</p>
            <p>Telephone Number: {this.state.selectedCustomer.WorkPhone}</p>
            <p>Mailing Address: {this.state.selectedCustomer.WorkAddress}</p>
            <p>Notes: {this.state.selectedCustomer.Comments}</p>
          </CardBody>
        </Card>
      );
    }
  }
}
