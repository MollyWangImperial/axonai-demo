# AxonAI 康复助手 iPhone App

这是一个独立的 Expo/React Native iPhone App 原型，位于：

`E:\AxonAIRepo\axonai_vps\axonai_rehab_ios_app`

## 当前版本包含

- 中文界面。
- 5 个功能评估包入口：
  - 上肢功能包
  - 手功能包
  - 步态包
  - 平衡包
  - 躯干控制包
- 当前只有上肢功能包可完整使用。
- 上肢包包含 9 个动作逐个采集：
  - 肩关节屈曲/上举
  - 肩关节外展
  - 手到口
  - 前伸够物
  - 肘屈伸
  - 前臂旋前/旋后
  - 腕背伸
  - 抓握-释放
  - 指鼻/目标触碰
- 每个动作录制后需要进行视频质量确认。
- 全部采集完成后生成演示版默认结果：
  - 患者功能问题
  - 一周训练计划
  - 每个训练动作的中文示范和注意事项

## 当前版本不包含

- 真实视频算法分析。
- OpenSim / MediaPipe 后端计算。
- 医疗诊断结论。
- 云端上传、账号系统、治疗师端审核。

当前生成结果是默认演示值，用于验证 iPhone App 流程和 UI。

## 本机预览

```powershell
cd E:\AxonAIRepo\axonai_vps\axonai_rehab_ios_app
npm install
npx expo start --clear
```

然后用 iPhone 安装 Expo Go，扫描终端里的二维码进行真机测试。

当前项目已降级到 Expo SDK 54，以兼容 App Store 版本的 Expo Go。

Web 预览：

```powershell
npm run web
```

## 类型检查

```powershell
npm run typecheck
```

## iOS TestFlight / App Store 构建

需要：

- Apple Developer Program 账号。
- App Store Connect 中创建同 bundle identifier 的 App。
- Expo 账号。
- EAS CLI。

安装 EAS CLI：

```powershell
npm install -g eas-cli
```

登录并初始化：

```powershell
eas login
eas init
```

`eas init` 会在 `app.json` 中写入真实 Expo projectId。

生成 TestFlight/App Store 构建：

```powershell
npm run build:ios:store
```

提交到 App Store Connect：

```powershell
npm run submit:ios
```

提交后仍需要在 App Store Connect 填写隐私信息、截图、描述、年龄分级和审核信息，并通过 Apple App Review 后，患者才能从 App Store 下载。
