

sudo apt-get install git-lfs
git config lfs.fetchinclude "*"
git lfs pull

cd .. 
mv invokeai/ invokeai_existing/
mkdir invokeai
cd invokeai

uv venv --relocatable --prompt invoke --python 3.12 --python-preference only-managed .venv

source .venv/bin/activate

cd /workspace/InvokeAI

uv pip install -e ".[dev,test,docs]" --python 3.12 --python-preference only-managed --index=https://download.pytorch.org/whl/cu13 --reinstall

npm install -g pnpm
cd ./invokeai/frontend/web
pnpm i
pnpm build


sudo apt update && sudo apt install screen
