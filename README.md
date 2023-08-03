# 人工智能互动助手

本项目为一个基于大语言模型的视频评论回复系统，包含服务端脚本与移动端工程文件。其中服务端由一个负责生成回复的回复服务脚本与一个负责与移动端及目标网站通信的数据服务脚本组成；移动端则为 HarmonyOS 元服务形式，提供完整服务与桌面万能卡片。

### 文件结构

```bash
├───client
│───server
├───utils
│   └───scripts
```

项目的主要程序文件存放在 `client/` 与 `server/` 下。其中 `client/` 为移动端程序的 DevEco Studio 元服务工程项目，`server/` 则包含了负责生成回复的 `reply-server.py` 与一个负责与移动端及目标网站通信的 `data-server.py` 组成。

文件夹 `utils/` 包括一个工具脚本 `compress_code.py`，可以将代码缩进、换行全部删去变成一行紧密排列的文本，方便与 GPT-4 进行交流，向 AI 询问代码建议（GPT-4 对代码的理解能力远高于人类，不需要缩进、换行等）。

## 运行指南

本项目基于 Python 编程语言，用到的外部代码库主要包括 [nemo2011/bilibili-api](https://github.com/nemo2011/bilibili-api)、[ymcui/Chinese-LLaMA-Alpaca](https://github.com/ymcui/Chinese-LLaMA-Alpaca/tree/main)、[oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui)、[Flask](https://github.com/pallets/flask) 等。程序运行使用的 Python 版本为 3.9.17，建议使用 [Anaconda](https://www.anaconda.com) 配置 Python 环境。以下为控制台/终端（Console/Terminal/Shell）指令。

```bash
# 创建环境
conda create -n ReplyAI python=3.9
conda activate ReplyAI

# 调用大语言模型（需要参考上文链接另行配置 text-generation-webui）
cd [外部库上级文件夹]/text-generation-webui
python server.py --chat --api --n-gpu-layers 2000000 --model chinese-llama-33b-ggml-f16.bin

# 启动服务程序前，需要提供个人账号信息。获取方式请参考文档：https://nemo2011.github.io/bilibili-api/#/get-credential
# 将信息填入 server/data/config_template.json 并将文件重命名为 config.json。
# 个人信息务必保管好！不要上传分享！

# 启动回复生成服务程序
cd [项目上级文件夹]/server
python reply-server.py

# 启动数据通信服务程序
python data-server.py
```

服务启动后，在 DevEco Studio 中导入并打开 `client/` 文件夹下的元服务工程项目，步骤可参考[DevEco 使用指南](https://developer.harmonyos.com/cn/docs/documentation/doc-guides/installation_process-0000001071425528)。

### 运行测试

运行元服务程序前，需要将主页面文件 `Conversation.ets` 与万能卡片文件 `WidgetCard.ets` 中的 ip 地址修改为实际服务器地址。两个文件的具体路径如下：

```bash
client/Application/entry/src/main/ets/pages/Conversation_template.ets
client/Application/entry/src/main/ets/widget/pages/WidgetCard.ets
```

### 补充说明

万能卡片底图使用 stability.ai 的 AI 作画模型 SDXL 1.0 生成，提示词及参数信息如下：

```bash
a robot surfing on the sea, The Great Wave off Kanagawa, Katsushika Hokusai Art, Japanese Ukiyo-e, Woodblock print, App background
Negative prompt: ugly, text, logo, monochrome, bad art
Steps: 20, Sampler: Euler a, CFG scale: 7, Seed: 3837218968, Size: 1024x1024, Model hash: 31e35c80fc, Model: sd_xl_base_1.0, Clip skip: 2, Version: v1.5.1
```

## 鸣谢
本项目调用的外部代码库包括 [nemo2011/bilibili-api](https://github.com/nemo2011/bilibili-api)、[ymcui/Chinese-LLaMA-Alpaca](https://github.com/ymcui/Chinese-LLaMA-Alpaca/tree/main)、[oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui)、[Flask](https://github.com/pallets/flask) 等。感谢各位软件工作者对开源社区的无私奉献！

本项目使用的大语言模型为 Meta AI 的 LLaMA 模型：

[1] [LLaMA: Open and Efficient Foundation Language Models](https://arxiv.org/abs/2302.13971)