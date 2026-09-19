import sys

# True when the backend runs inside the browser (Pyodide). There are no threads or
# subprocesses there, so anything parallel has to fall back to sequential.
IN_BROWSER = sys.platform == "emscripten"
N_JOBS = 1 if IN_BROWSER else -1

# Neural networks are matrix-multiply heavy and WebAssembly BLAS is slow, so cap the
# training iterations in the browser to keep every model interactive.
MLP_MAX_ITER = 200 if IN_BROWSER else 500
