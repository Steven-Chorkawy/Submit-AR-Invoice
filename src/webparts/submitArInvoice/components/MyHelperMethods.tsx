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
