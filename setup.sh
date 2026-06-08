

sudo apt-get install git-lfs
git config lfs.fetchinclude "*"
git lfs pull

cd .. 
#mv invokeai/ invokeai_existing/
#mkdir invokeai
git clone https://github.com/MubaslatLaith/invokeai.git
cd invokeai

uv venv --relocatable --prompt invoke --python 3.12 --python-preference only-managed .venv

source .venv/bin/activate

cd /workspace/InvokeAI-ContextManager

uv pip install -e ".[dev,test,docs]"   --python /workspace/invokeai/.venv/bin/python --index-url https://pypi.org/simple --extra-index-url https://download.pytorch.org/whl/nightly/cu128 --prerelease allow


npm install -g pnpm
cd ./invokeai/frontend/web
pnpm i
pnpm build


sudo apt update && sudo apt install screen


uv pip uninstall torch torchvision torchaudio --python /workspace/invokeai/.venv/bin/python


#uv pip install --pre torch torchvision torchaudio --python /workspace/invokeai/.venv/bin/python  --index-url https://download.pytorch.org/whl/nightly/cu128


uv pip install torch==2.7.1 torchvision==0.22.1 --python /workspace/invokeai/.venv/bin/python --index-url https://download.pytorch.org/whl/cu128


#copy default invokeai config (with multiuser set to true)
#cd ../../..
#cp invokeai.yaml /workspace/invokeai/invokeai.yaml


