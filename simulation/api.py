"""Local frontend integration API. Not production hardened/deployed."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse
from engine import (
    DeviceRequest,
    DeviceResponse,
    SearchResponse,
    MaterialScenarioRequest,
    SearchRequest,
    StressRequest,
    TunableDeviceRequest,
    evaluate,
    evaluate_tunable,
    material_scenario,
    search,
    stress_test,
)

app = FastAPI(title='Qubit Studio simulation', version='0.1.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS','http://localhost:3000,http://127.0.0.1:3000').split(','),
    allow_methods=['GET','POST'], allow_headers=['Content-Type'],
)

@app.exception_handler(RequestValidationError)
async def invalid_request(_request, exc):
    # Do not serialize Pydantic's original input/context: it can contain NaN,
    # arbitrary request values, or exceptions that JSON cannot represent.
    fields = {}
    for error in exc.errors():
        location = '.'.join(str(part) for part in error['loc'] if part != 'body') or 'request'
        fields.setdefault(location, []).append(error['msg'])
    return JSONResponse(status_code=422, content={
        'error': 'Invalid simulation request.', 'field_errors': fields,
    })


@app.exception_handler(ResponseValidationError)
async def invalid_result(_request, _exc):
    return JSONResponse(status_code=500, content={
        'error': 'The calculation returned an invalid result. No valid assessment is available.',
    })


def calculation_response(operation, request):
    try:
        return operation(request)
    except Exception:
        # A failed solver is an error, never an empty feasible set. Keep
        # implementation details and non-finite values out of the public JSON.
        return JSONResponse(status_code=500, content={
            'error': 'The numerical calculation failed. No valid assessment is available.',
        })


@app.get('/health')
def health():
    return {'status':'ok', 'model':'isolated-transmon', 'version':'0.1.0'}

@app.post('/evaluate', response_model=DeviceResponse)
def evaluate_device(request: DeviceRequest):
    return calculation_response(evaluate, request)

@app.post('/search', response_model=SearchResponse)
def search_devices(request: SearchRequest):
    return calculation_response(search, request)


@app.post('/material-scenario')
def compare_material_scenario(request: MaterialScenarioRequest):
    return calculation_response(material_scenario, request)


@app.post('/stress')
def stress_device(request: StressRequest):
    return calculation_response(stress_test, request)


@app.post('/evaluate-tunable')
def evaluate_tunable_device(request: TunableDeviceRequest):
    return calculation_response(evaluate_tunable, request)
