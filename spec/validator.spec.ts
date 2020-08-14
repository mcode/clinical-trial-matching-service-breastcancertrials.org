import { ResearchStudy } from '../src/research-study';
import { TrialResponse } from "../src/breastcancertrials";

import * as fs from 'fs';
import * as path from 'path';

import { Fhir } from 'fhir/fhir';
import { ValidatorMessage } from 'fhir/validator';

describe('FHIR Validation', () => {
  const fhir = new Fhir();

  it('converting result to ResearchStudy produces a valid FHIR object', function () {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, '../../spec/data/trial_object.json'), { encoding: 'utf8' }, (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        const json: TrialResponse = JSON.parse(data) as TrialResponse;
        const study = new ResearchStudy(json, 1);
        const result = fhir.validate(study);
        if (result.messages && result.messages.length > 0) {
          console.error('Validation has messages:');
          for (const message of result.messages) {
            formatValidationMessage(message);
          }
        }
        expect(result.valid).toBeTrue();
        resolve();
      });
    });
  });
});

/**
 * Helper function to format a validation message from fhir.validate
 */
function formatValidationMessage(message: ValidatorMessage, output: (str: string) => void = console.error): void {
  let m = message.message ? message.message : '(no message from validator)';
  if (message.severity) {
    m = '[' + message.severity.toUpperCase() + '] ' + m;
  }
  if (message.location) {
    m += ' ' + message.location;
  }
  if (message.resourceId) {
    m += ' in ' + message.resourceId;
  }
  output(m);
}
