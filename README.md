# 人工智能回复助手

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



### 环境配置

```bash
# 创建 conda 环境，将其命名为 SnakeAI，Python 版本 3.8.16
conda create -n SnakeAI python=3.8.16
conda activate SnakeAI
```

在 Windows 与 macOS 下配置外部代码库的过程略有不同。Windows 下使用 CUDA 加速，macOS 下则使用 MPS (Metal Performance Shaders) 进行加速，且需要降级 `pip` 与 `setuptools`。

Windows:
```bash 
# 使用 GPU 训练需要手动安装完整版 PyTorch
conda install pytorch=2.0.0 torchvision pytorch-cuda=11.8 -c pytorch -c nvidia

# 运行程序脚本测试 PyTorch 是否能成功调用 GPU
python .\utils\check_gpu_status.py

# 安装外部代码库
pip install -r requirements.txt
```

macOS (Apple Silicon):
```bash
# 使用 GPU 训练需要手动安装 Apple Silicon 版 PyTorch
conda install pytorch::pytorch=2.0.1 torchvision torchaudio -c pytorch

# 运行程序脚本测试 PyTorch 是否能成功调用 GPU
python utils/check_gpu_status_mps.py

# 安装 tensorboard
pip install tensorboard==2.13.0

# 降级安装外部代码库
pip install setuptools==65.5.0 pip==21
pip install -r requirements.txt
```

### 运行测试

项目 `main/` 文件夹下包含经典游戏《贪吃蛇》的程序脚本，基于 [Pygame](https://www.pygame.org/news) 代码库，可以直接运行以下指令进行游戏：

```bash
cd [项目上级文件夹]/snake-ai/main
python .\snake_game.py
```

环境配置完成后，可以在 `main/` 文件夹下运行 `test_cnn.py` 或 `test_mlp.py` 进行测试，观察两种智能代理在不同训练阶段的实际表现。

```bash
cd [项目上级文件夹]/snake-ai/main
python test_cnn.py
python test_mlp.py
```

模型权重文件存储在 `main/trained_models_cnn/` 与 `main/trained_models_mlp/` 文件夹下。两份测试脚本均默认调用训练完成后的模型。如果需要观察不同训练阶段的 AI 表现，可将测试脚本中的 `MODEL_PATH` 变量修改为其它模型的文件路径。

### 训练模型

如果需要重新训练模型，可以在 `main/` 文件夹下运行 `train_cnn.py` 或 `train_mlp.py`。

```bash
cd [项目上级文件夹]/snake-ai/main
python train_cnn.py
python train_mlp.py
```

### 查看曲线

项目中包含了训练过程的 Tensorboard 曲线图，可以使用 Tensorboard 查看其中的详细数据。推荐使用 VSCode 集成的 Tensorboard 插件直接查看，也可以使用传统方法：

```bash
cd [项目上级文件夹]/snake-ai/main
tensorboard --logdir=logs/
```

在浏览器中打开 Tensorboard 服务默认地址 `http://localhost:6006/`，即可查看训练过程的交互式曲线图。

## 鸣谢
本项目调用的外部代码库包括 [nemo2011/bilibili-api](https://github.com/nemo2011/bilibili-api)、[ymcui/Chinese-LLaMA-Alpaca](https://github.com/ymcui/Chinese-LLaMA-Alpaca/tree/main)、[oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui)、[Flask](https://github.com/pallets/flask) 等。感谢各位软件工作者对开源社区的无私奉献！

本项目使用的大语言模型为 Meta AI 的 LLaMA 模型：

[1] [LLaMA: Open and Efficient Foundation Language Models](https://arxiv.org/abs/2302.13971)