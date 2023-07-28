# reply-ai
 基于大语言模型的评论回复机器人。

[bilibili-api](https://github.com/nemo2011/bilibili-api)

```
# 创建环境
conda create -n ReplyAI python=3.9
conda activate ReplyAI
```

将信息填入 config_template.json 并将文件重命名为 config.json。

```
# 启动 text-generation-webui
python server.py --chat --api --n-gpu-layers 2000000 --model chinese-llama-33b-ggml-f16.bin
```