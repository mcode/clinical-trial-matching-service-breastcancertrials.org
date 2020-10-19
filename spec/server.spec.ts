import request from 'supertest';
import start, { BreastCancerTrialsService } from '../src/server';
import http from 'http';
import { SearchSet } from 'clinical-trial-matching-service';

describe('BreastCancerTrialsService', () => {
  describe('when listening', () => {
    let service: BreastCancerTrialsService;
    let server: http.Server;
    beforeAll(() => {
      service = new BreastCancerTrialsService({ api_endpoint: 'http://localhost/', port: 0 });
      return service.init().then(() => {
        server = service.listen();
      });
    });
    afterAll(() => {
      service.close();
    });

    it('responds to /', () => {
      return request(server).get('/').set('Accept', 'application/json').expect(200);
    });

    it('uses the query runner', (done) => {
      const runQuery = spyOn(service, 'matcher').and.callFake(() => {
        return Promise.resolve(new SearchSet([]));
      });
      return request(server)
        .post('/getClinicalTrial')
        .send({ patientData: { resourceType: 'Bundle', type: 'collection', entry: [] } })
        .set('Accept', 'application/json')
        .expect(200)
        .end(() => {
          expect(runQuery).toHaveBeenCalled();
          done();
        });
    });
  });

  describe('constructor', () => {
    it("raises an error if the endpoint isn't given", () => {
      expect(() => {
        new BreastCancerTrialsService({});
      }).toThrowError('Missing API_ENDPOINT in configuration');
    });
  });
});

describe('start()', () => {
  const testedValues = ['NODE_ENV', 'API_ENDPOINT'];
  const initialEnv: Record<string, string | undefined> = {};
  beforeAll(() => {
    // Store the environment variables we're going to clobber in these tests
    for (const key of testedValues) {
      if (key in process.env) initialEnv[key] = process.env[key];
    }
  });
  afterAll(() => {
    // Restore the environment variables we clobbered
    for (const key of testedValues) {
      if (key in initialEnv) {
        process.env[key] = initialEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });
  it('loads configuration via dotenv-flow', () => {
    process.env.NODE_ENV = 'test';
    process.env.API_ENDPOINT = 'https://www.example.com/test/endpoint';
    process.env.PORT = '0';
    return expectAsync(
      start().then((service) => {
        expect(service.port).toEqual(0);
        // TODO: Figure out a way to see what the API endpoint got set to
      })
    ).toBeResolved();
  });
});
