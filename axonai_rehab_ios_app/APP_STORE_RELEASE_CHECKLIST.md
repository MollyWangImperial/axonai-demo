# App Store 发布清单

## 必须由账号持有人完成

- 加入 Apple Developer Program。
- 在 App Store Connect 创建 App。
- Bundle ID 使用 `com.axonai.neurorehab`，如果已被占用，需要改成你团队名下唯一 ID。
- 在 `eas.json` 的 `submit.production.ios.ascAppId` 填入 App Store Connect 的 Apple ID。
- 运行 `eas init`，让 Expo 在 `app.json` 中写入真实 projectId。
- 运行 `npm run build:ios:store` 生成 iOS build。
- 运行 `npm run submit:ios` 上传到 App Store Connect。

## App Store 页面需要准备

- App 名称：AxonAI康复助手
- 副标题：脑卒中康复动作采集与训练计划
- 类别：Medical 或 Health & Fitness，需要根据实际定位确认。
- 隐私政策 URL。
- iPhone 截图。
- App Review 联系方式。
- Demo 账号：当前版本不需要登录，可说明无需账号。

## 隐私与医疗说明

当前原型只在设备端录制动作视频，不包含云端上传。正式版本如果加入上传、治疗师端、OpenSim 分析或患者账号，需要更新：

- 隐私政策。
- App Store Privacy Nutrition Label。
- 数据删除方式。
- 医疗免责声明。
- 治疗师审核流程。

## 审核风险提示

- 不要把演示版默认结果描述为真实诊断。
- 如果 App 声称自动诊断、治疗或替代医生/治疗师判断，审核风险会显著提高。
- 建议文案使用“训练辅助”“动作记录”“康复计划参考”，并明确“不能替代专业医疗建议”。
