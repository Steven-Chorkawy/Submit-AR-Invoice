import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Card, CardTitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { IMyCustomerProps } from '../components/IMyCustomerProps';
import { IMyCustomerState } from '../components/IMyCustomerState';

export class MyCustomerCardComponent extends React.Component<IMyCustomerProps, IMyCustomerState> {

  /**
   *
   */
  constructor(props) {
    super(props);
    console.log("MyCustomerCard");
    console.log(props);

    this.state = {
      selectedCustomer: props.selectedCustomer
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ ...nextProps });
  }

  render() {
    console.log("MyCustomCardRender");
    console.log(this.state);
    // Nothing is selected.
    if (this.state.selectedCustomer == undefined) {
      return (<div key="0">Select a Customer</div>);
    }
    // Custom value is entered.
    // If id isn't present that means the user has given us a custom value.
    else if(!this.state.selectedCustomer.hasOwnProperty('ID')) {
      return(<h4>TODO: Create a form here to get custom customer info.</h4>);
    }
    // existing value is selected.
    else {
      return (
        // TODO: Design this better! This is just for the first round of review.
        <Card key={this.state.selectedCustomer.ID} type="info">
          <CardBody>
            <CardTitle>{this.state.selectedCustomer.Title}</CardTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p>GP Customer ID: {this.state.selectedCustomer.GPCustomerID}</p>
              <p>Customer Name: {this.state.selectedCustomer.Company}</p>
              <p>Email Address: {this.state.selectedCustomer.Email}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p>Telephone Number: {this.state.selectedCustomer.WorkPhone}</p>
              <p>Mailing Address: {this.state.selectedCustomer.WorkAddress}</p>
            </div>
            <p>Notes: {this.state.selectedCustomer.Comments}</p>
          </CardBody>
        </Card>
      );
    }
  };

}
