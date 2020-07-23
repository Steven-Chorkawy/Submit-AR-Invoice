import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';

interface IMyKendoFilter {
  field: string;
  operator: string;
  value: any;
}

interface IMyQueryParameters {
  FilterField: string;
  FilterValue: string;
}

export const ConvertQueryParamsToKendoFilter = (fields:IMyQueryParameters[]) => {
  let output = [];
  let queryParams = new UrlQueryParameterCollection(window.location.href);
  for (let index = 0; index < fields.length; index++) {
    const element:IMyQueryParameters = fields[index];
    let myParmField = queryParams.getValue(element.FilterField);
    let myParmValue = queryParams.getValue(element.FilterValue);
    if(myParmField != undefined && myParmField != undefined) {
      let kendoFilter: IMyKendoFilter = {
        field: myParmField,
        operator: "contains",
        value: myParmValue
      }
      output.push(kendoFilter);
    }
  }
  return output;
};


/**
 * Generate a random GUID string.
 */
export const BuildGUID = () => {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

const S4 = () => {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}


