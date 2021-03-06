
import React from 'react';
import { getter } from '@progress/kendo-react-common';

const emailRegex = new RegExp(/\S+@\S+\.\S+/);
const phoneRegex = new RegExp(/^[0-9 ()+-]+$/);
const ccardRegex = new RegExp(/^[0-9-]+$/);
const cvcRegex = new RegExp(/^[0-9]+$/);

/** Stuff from Demo */
export const termsValidator = (value) => value ? "" : "It's required to agree with Terms and Conditions.";
export const emailValidator = (value) => !value ?
  "Email field is required." :
  (emailRegex.test(value) ? "" : "Email is not valid format.");
export const nameValidator = (value) => !value ?
  "Full Name is required" :
  value.length < 7 ? "Full Name should be at least 7 characters long." : "";
export const userNameValidator = (value) => !value ?
  "User Name is required" :
  value.length < 5 ? "User name should be at least 3 characters long." : "";
export const phoneValidator = (value) => !value ?
  "Phone number is required." :
  phoneRegex.test(value) ? "" : "Not a valid phone number.";
export const cardValidator = (value) => !value ?
  "Credit card number is required. " :
  ccardRegex.test(value) ? "" : "Not a valid credit card number format.";

export const cvcValidator = (value) => !value ?
  "CVC code is required," :
  cvcRegex.test(value) || value.length !== 3 ? "" : "Not a valid CVC code format.";

export const guestsValidator = (value) => !value ?
  "Number of guests is required" :
  value < 5 ? "" : "Maximum 5 guests";

export const nightsValidator = (value) => value ? "" : "Number of Nights is required";

export const colorValidator = (value) => value ? "" : "Color is required.";
export const requiredValidator = (value) => value ? "" : "Error: This field is required.";




/**My Stuff */
export const dateValidator = (value) => value ? "" : "Date is required";
export const departmentValidator = (value) => value ? "" : "Department is required";
export const requestedByValidator = (value) => value ? "" : "Requested By is required";
export const requiresApprovalFrom = (value) => {
  if (value) {
    if (value.length > 0) {
      return '';
    }
  }
  return "Requires Approval From is required";
};
export const requiresCustomer = (value) => value ? "" : "Customer is required";
export const requiresCustomerPONUmber = (value) => value ? '' : "Customer PO Number is required";

// People Picker Validator. 
export const requireOneOrMorePeople = (value) => value ? '' : 'Send an approval request to one or more users.';


// GL/Accounts
/**
 * 'value' is the masked input from the form.
 * Initially it will be null.  After the user has made any change to value it will be '___-__-___-_____-____'
 * As the user enters their GL Code the '_' characters will be replaced with their numbers.
 *
 * We cannot check the length of the input to validate it without stripping away all the '-' characters.
 * Instead to validate the GL Code for length I'm going on the assumption that once all '_' characters are gone the user has entered the entire code.
 */
export const glCodeValidator = (value) => !value ? "G/L Account # is required." :
  value.includes('_') ? "G/L Account # is too short." : "";

export const accountAmountValidator = (value) => !value ?
  "Amount is required." :
  value == 0 ? "Amount cannot be $0.00" : "";
/** End My Stuff */


const userNameGetter = getter('username');
const emailGetter = getter('email');

export const formValidator = (values) => {
  const userName = userNameGetter(values);
  const emailValue = emailGetter(values);

  if (userName && emailValue && emailRegex.test(emailValue)) {
    return {};
  }

  return {
    VALIDATION_SUMMARY: 'Please fill the following fields.',
    ['username']: !userName ? 'User Name is required.' : '',
    ['email']: emailValue && emailRegex.test(emailValue) ? '' : 'Email is required and should be in valid format.'
  };
};
