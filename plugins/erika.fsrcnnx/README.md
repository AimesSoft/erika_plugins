# FSRCNNX 超分

打包自 [igv/FSRCNN-TensorFlow](https://github.com/igv/FSRCNN-TensorFlow) v1.1 的经典 2× 卷积神经网络超分辨率着色器。启用后会在播放器「画质增强 › 超分辨率」中新增 **FSRCNNX** 分组，由 liberika 的原生神经网络引擎直接编译执行。

## 模型

- **8-0-4-1（均衡）**：轻量快速，适合大多数 720p / 1080p 影视与动画片源实时放大。
- **16-0-4-1（高质量）**：更宽的特征通道，保留更多细微纹理与边缘细节。

## 权限

- **超分模型**（`picture.upscaler`）：向播放内核提供神经网络超分权重文件，不运行脚本、不访问网络。

## 许可证

着色器文件遵循上游项目 [GNU LGPL v3.0](https://www.gnu.org/licenses/lgpl-3.0.html) 协议，版权归 igv 所有。

## 更新日志

- 1.0.0：收录 FSRCNNX v1.1 的 `8-0-4-1` 与 `16-0-4-1` 两款 2× 超分模型。
