import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { Audio, ResizeMode, Video } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

type Screen =
  | 'welcome'
  | 'auth'
  | 'patientOnboarding'
  | 'therapistOnboarding'
  | 'therapistDashboard'
  | 'home'
  | 'strokeEducation'
  | 'peerSupport'
  | 'feedback'
  | 'assessment'
  | 'patient训练'
  | 'patientCare'
  | 'patient我的'
  | 'collect'
  | 'collectionGuide'
  | 'analysisLoading'
  | 'metrics'
  | 'problems'
  | 'planLoading'
  | 'plan'
  | 'demo'
  | 'match'
  | 'profile'
  | 'waiting';
type UserRole = 'patient' | 'therapist';
type PatientTab = 'home' | 'assessment' | 'training' | 'care' | 'me';
type AuthCredentials = {
  identifier: string;
  password: string;
};
type AccountSession = {
  userId: string;
  role: UserRole;
  identifier: string;
};
type PackageKey = 'upper' | 'hand' | 'gait' | 'balance' | 'trunk';

type PatientProfile = {
  fullName: string;
  ageRange: string;
  gender: string;
  language: string;
  location: string;
  strokeType: string;
  onsetTime: string;
  affectedSide: string;
  dominantHand: string;
  mobilityLevel: string;
  upperLimbAbility: string;
  safetyFlags: string[];
  mainGoal: string;
  supportMode: string;
};

type TherapistProfile = {
  fullName: string;
  title: string;
  profession: string;
  location: string;
  languages: string;
  yearsExperience: string;
  strokeExperience: string;
  specialties: string[];
  assessments: string[];
  supportMode: string;
  availability: string;
};

type RehabPackage = {
  key: PackageKey;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
};

type CollectionAction = {
  id: string;
  title: string;
  target: string;
  instruction: string;
  cameraView: '正面视角' | '侧面视角';
  viewInstruction: string;
  guideScript: string;
  demoVideoUrl?: string;
};

type Problem = {
  title: string;
  summary: string;
  detail: string;
  area: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Exercise = {
  id: string;
  title: string;
  improves: string;
  dose: string;
  dayPattern: number[];
  imageTone: string;
  coverImage: ImageSourcePropType;
  demoVideoUrl?: string;
  steps: string[];
  cautions: string[];
};

type ApiFunctionalProblem = {
  id: string;
  title: string;
  severity: string;
  patient_summary: string;
  daily_life_impact: string[];
  evidence: string[];
};

type ApiExercisePlanItem = {
  exercise_id: string;
  name: string;
  improves: string[];
  dose: string;
  days: string[];
  instructions: string[];
  precautions: string[];
  progression: string;
};

type UpperLimbAnalysisResult = {
  algorithmVersion: string;
  qualitySummary: {
    failed: string[];
    review: string[];
    missingMetrics: string[];
    meanConfidence: number;
  };
  actionAnalyses?: Array<{
    action_id: string;
    metrics?: Record<string, number | string | boolean | null>;
    metric_confidence?: number;
  }>;
  functionalProblems: ApiFunctionalProblem[];
  opensimDecision: {
    needed: boolean;
    priority: string;
    reasons: string[];
    recommended_workflow: string[];
  };
  weeklyExercisePlan: ApiExercisePlanItem[];
  patientFacingSummary: {
    title: string;
    problems: string[];
    trainingFocus: string[];
    reviewNote: string;
  };
};

type VideoQualityResult = {
  actionId: string;
  passed: boolean;
  status: 'pass' | 'fail' | string;
  score: number;
  patientMessage: string;
  issues: string[];
  tips: string[];
};

type FrameCheckResult = {
  actionId: string;
  passed: boolean;
  status: 'ready' | 'adjust' | string;
  score: number;
  patientMessage: string;
  tips: string[];
  visibleParts?: string[];
  missingParts?: string[];
};

type MatchedPerson = {
  name: string;
  title: string;
  organization: string;
  matchScore: string;
  tags: string[];
  experience: string[];
  focus: string[];
};

const packages: RehabPackage[] = [
  {
    key: 'upper',
    title: '上肢功能包',
    subtitle: '肩、肘、前臂、腕和手的协调控制',
    icon: 'fitness',
    active: true,
  },
  { key: 'hand', title: '手功能包', subtitle: '抓握、释放和精细动作', icon: 'hand-left', active: false },
  { key: 'gait', title: '步态包', subtitle: '步行稳定性和步态对称性', icon: 'walk', active: false },
  { key: 'balance', title: '平衡包', subtitle: '坐位、站立和平衡控制', icon: 'body', active: false },
  { key: 'trunk', title: '躯干控制包', subtitle: '躯干稳定、转身和坐位控制', icon: 'accessibility', active: false },
];

const upperActions: CollectionAction[] = [
  {
    id: 'shoulder-flexion',
    title: '肩关节屈曲/上举',
    target: '主动肩关节上举',
    instruction: '坐直，慢慢将患侧手臂向前向上抬起，再有控制地放下。',
    cameraView: '侧面视角',
    viewInstruction: '从患侧侧面拍摄，确保肩、肘、腕和躯干可见。',
    guideScript: '侧面对摄像头坐好。手臂放松开始，慢慢向前抬到舒适高度，停一下，再有控制地放下。',
    demoVideoUrl: 'https://files2.heygen.ai/movio/video/8d5a7614c8aa4642bc1c8627df579f25/cbfc2a85da764dfbbb8ab0c2a29ee75e/caption.mp4?Expires=1781777428&Signature=To4A6BTGZFsKISSCT2aa2VEIUP8sPsSfvFsbQK67CiujYQCQSjNSHT1IDG98--GqcuE-mO8WihwZxLWKHHmcrUSARgUaqV2nJaOZmvJs6Jo~~Q2SZt433RZUd9xE9r8N4SUFqGGw2BsZfcxaca8VIEC8tAMk9HFMwoPyzFluN0batf62n-O0uDAI-2RRMehm2Y~phzQlLrvw0tu0-eZdznSVdyFn08OoEL0kQN1B034HcmmQoH4RiL6i3Yo5Ihmy81~dgj95PFt0~7cdSqMOJm9~rbZuQS5oF5ErS~S2gxxUidHSj1ZmgFj1NuJLiqpX5TbYr7M9qvmz4ipzHdmkEw__&Key-Pair-Id=K38HBHX5LX3X2H',
  },
  {
    id: 'shoulder-abduction',
    title: '肩关节外展',
    target: '肩外展与耸肩代偿',
    instruction: '将患侧手臂从身体侧方抬至肩高，再慢慢放下。',
    cameraView: '正面视角',
    viewInstruction: '从正面拍摄，确保双肩和完整患侧手臂在画面内。',
    guideScript: '正面对摄像头。保持躯干稳定，将患侧手臂从侧方抬向肩高，停一下，再慢慢放下。',
  },
  {
    id: 'hand-mouth',
    title: '手到口',
    target: '肘屈曲与进食相关动作',
    instruction: '将患侧手从桌面或大腿上抬起，轻触口部附近，再放回。',
    cameraView: '侧面视角',
    viewInstruction: '从患侧侧面拍摄，确保肘部弯曲和手部路径可见。',
    guideScript: '侧面对摄像头坐好。手从大腿或桌面开始，带向嘴边轻触，再慢慢返回。',
  },
  {
    id: 'reach',
    title: '前伸够物',
    target: '前伸、伸肘与终点控制',
    instruction: '坐位向前伸手触碰目标物，然后回到起始位置。',
    cameraView: '侧面视角',
    viewInstruction: '从侧面拍摄，确保躯干、肩、肘和目标物可见。',
    guideScript: '侧面对摄像头坐好，前方放目标物。向前够并触碰目标，尽量不要过度前倾，然后返回。',
  },
  {
    id: 'elbow',
    title: '肘关节屈伸',
    target: '肘关节控制',
    instruction: '上臂靠近身体，反复屈伸肘关节。',
    cameraView: '侧面视角',
    viewInstruction: '从患侧侧面拍摄，确保完整肘屈伸过程可见。',
    guideScript: '侧面对摄像头坐好。上臂靠近身体，缓慢屈伸肘部三次。',
  },
  {
    id: 'forearm',
    title: '前臂旋前/旋后',
    target: '手掌翻转能力',
    instruction: '肘部约弯曲90度，缓慢将手掌向上、向下翻转。',
    cameraView: '正面视角',
    viewInstruction: '从正面拍摄，肘部弯曲，让手掌上下翻转清晰可见。',
    guideScript: '正面对摄像头。肘部弯曲约90度。慢慢掌心向上、再向下翻转，肩部尽量不要跟着动。',
  },
  {
    id: 'wrist',
    title: '腕背伸',
    target: '腕伸肌控制',
    instruction: '支撑前臂，将手腕向上抬起并保持，再慢慢放下。',
    cameraView: '侧面视角',
    viewInstruction: '从侧面拍摄，确保腕部向上抬起清晰可见。',
    guideScript: '前臂放在桌上，手伸出桌边。将手腕向上抬起，短暂停留，再慢慢放下。',
  },
  {
    id: 'grasp',
    title: '抓握-释放',
    target: '手指张开与释放能力',
    instruction: '拿住软球或毛巾，轻轻握住，再主动张手释放。',
    cameraView: '正面视角',
    viewInstruction: '从正面拍摄，手部距离适中，能看清手指张开和释放。',
    guideScript: '正面对摄像头。拿一个软物，轻轻握住，然后尽量清楚地张手释放。',
  },
  {
    id: 'finger-nose',
    title: '指鼻/目标触碰',
    target: '上肢协调性与准确性',
    instruction: '用患侧食指多次触碰鼻尖或屏幕目标。',
    cameraView: '正面视角',
    viewInstruction: '从正面拍摄，确保手指路径、目标和躯干可见。',
    guideScript: '正面对摄像头。用患侧食指触碰鼻尖或目标，返回，并缓慢重复。',
  },
];

const activeUpperActions = upperActions.slice(0, 3);

const demoProblems: Problem[] = [
  {
    title: '主动上举受限',
    summary: '患侧手臂上举时容易提前停止',
    detail: '可能与肩部控制不足或肩胛稳定性下降有关。',
    area: '肩关节',
    accent: '#0f6eff',
    icon: 'body',
  },
  {
    title: '明显躯干/肩胛代偿',
    summary: '身体会代偿帮助抬手和够物',
    detail: '可能表现为耸肩、躯干侧倾或后仰。',
    area: '肩胛稳定',
    accent: '#00b8a9',
    icon: 'git-compare',
  },
  {
    title: '腕背伸和释放较弱',
    summary: '抓握后张开手不够顺畅',
    detail: '可能影响拿杯子、释放物体和穿衣等活动。',
    area: '腕和手',
    accent: '#ff8a00',
    icon: 'hand-left',
  },
];

const exercises: Exercise[] = [
  {
    id: 'table-slide',
    title: '桌面滑手前举',
    improves: '改善主动肩上举和抬手够物能力',
    dose: '3组 x 12次',
    dayPattern: [1, 2, 3, 4, 5, 6],
    imageTone: '#dff7ff',
    coverImage: require('./assets/exercise-covers/table-slide-generated.png'),
    steps: [
      '前臂放在毛巾上坐好。',
      '保持身体直立，慢慢将患侧手向前滑。',
      '在可控制范围内停留2秒，再滑回。',
    ],
    cautions: ['不要耸肩。', '不要用后仰代替抬手。', '如肩痛明显，请停止。'],
  },
  {
    id: 'scapula-setting',
    title: '肩胛稳定训练',
    improves: '减少耸肩和躯干代偿',
    dose: '3组 x 10次',
    dayPattern: [1, 2, 4, 5, 7],
    imageTone: '#eaf2ff',
    coverImage: require('./assets/exercise-covers/scapula-setting-generated.png'),
    steps: [
      '双肩放松坐好。',
      '轻轻将肩胛骨向后向下收，不要耸肩。',
      '保持3秒，然后放松并重复。',
    ],
    cautions: ['保持动作轻柔。', '保持颈部放松。', '自然呼吸。'],
  },
  {
    id: 'elbow-reach',
    title: '坐位肘伸展够物',
    improves: '改善前伸够物和伸肘控制',
    dose: '3组 x 8次',
    dayPattern: [1, 3, 5, 6],
    imageTone: '#fff4db',
    coverImage: require('./assets/exercise-covers/elbow-reach-generated.png'),
    steps: ['在桌上放一个杯子。', '用患侧手缓慢向前够物。', '触碰目标后平稳返回。'],
    cautions: ['目标不要放得太远。', '不要突然向前冲。', '保持坐姿稳定。'],
  },
  {
    id: 'wrist-open',
    title: '腕背伸与张手训练',
    improves: '改善腕背伸和抓握释放困难',
    dose: '3组 x 12次',
    dayPattern: [2, 3, 4, 6, 7],
    imageTone: '#ffe9df',
    coverImage: require('./assets/exercise-covers/wrist-open-generated.png'),
    steps: ['前臂放在桌上，手掌朝下。', '轻轻将手腕向上抬起。', '张开手指并保持2秒。'],
    cautions: ['不要憋气。', '不要用另一只手强行拉手指。', '如果手指痉挛明显，请减少次数。'],
  },
];

const matchedPerson: MatchedPerson = {
  name: '陈雨晴',
  title: '神经康复治疗师',
  organization: '上海神经康复中心',
  matchScore: '96%',
  tags: ['脑卒中上肢康复', '肩手综合征预防', '居家训练'],
  experience: [
    '8年脑卒中康复经验，长期专注上肢功能恢复训练。',
    '熟悉 Fugl-Meyer 上肢评估、ARAT 和日常生活能力训练。',
    '擅长把视频中观察到的动作问题转化为患者每天可执行的训练任务。',
  ],
  focus: ['主动肩上举受限', '肩胛和躯干代偿', '腕背伸与抓握释放控制'],
};

const supportNames = [
  '康复师 - 陈雨晴',
  '护工 - 赵阿姨',
  '陪护 - 刘晨',
  '技师 - 周明',
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const displayWeekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const apiBaseUrl = process.env.EXPO_PUBLIC_AXONAI_API_URL ?? 'https://axonai-demo.onrender.com';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

class PatientSafeApiError extends Error {
  status?: number;
  internalDetail?: string;

  constructor(message: string, status?: number, internalDetail?: string) {
    super(message);
    this.name = '患者SafeApiError';
    this.status = status;
    this.internalDetail = internalDetail;
  }
}

function getBackendDetail(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === 'string') return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function reportInternalError(context: string, error: unknown) {
  console.warn(`[AxonAI] ${context}`, error);
}

function showFriendlyError(title: string, message: string, context: string, error: unknown) {
  reportInternalError(context, error);
  Alert.alert(title, message);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutValue: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(timeoutValue), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

const actionIdToApiId: Record<string, string> = {
  'shoulder-flexion': 'shoulder_flexion',
  'shoulder-abduction': 'shoulder_abduction',
  'hand-mouth': 'hand_to_mouth',
  reach: 'forward_reach',
  elbow: 'elbow_flex_ext',
  forearm: 'forearm_pronation_supination',
  wrist: 'wrist_extension',
  grasp: 'grasp_release',
  'finger-nose': 'finger_nose_target',
};

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let internalDetail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      internalDetail = getBackendDetail(body, internalDetail);
    } catch {
      // Keep the HTTP status when the backend does not return JSON.
    }
    throw new PatientSafeApiError('Request failed. Please try again.', response.status, internalDetail);
  }
  return (await response.json()) as T;
}

function patientProfileToSupabaseRow(userId: string, profile: PatientProfile) {
  return {
    user_id: userId,
    full_name: profile.fullName,
    age_range: profile.ageRange,
    gender: profile.gender,
    language: profile.language,
    location: profile.location,
    stroke_type: profile.strokeType,
    onset_time: profile.onsetTime,
    affected_side: profile.affectedSide,
    dominant_hand: profile.dominantHand,
    mobility_level: profile.mobilityLevel,
    upper_limb_ability: profile.upperLimbAbility,
    safety_flags: profile.safetyFlags,
    main_goal: profile.mainGoal,
    support_mode: profile.supportMode,
    profile_json: profile,
  };
}

function therapistProfileToSupabaseRow(userId: string, profile: TherapistProfile) {
  return {
    user_id: userId,
    full_name: profile.fullName,
    title: profile.title,
    profession: profile.profession,
    location: profile.location,
    languages: profile.languages,
    years_experience: profile.yearsExperience,
    stroke_experience: profile.strokeExperience,
    specialties: profile.specialties,
    assessments: profile.assessments,
    support_mode: profile.supportMode,
    availability: profile.availability,
    profile_json: profile,
  };
}

async function upsertSupabaseBaseProfile(userId: string, role: UserRole, identifier: string) {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: userId,
      role,
      display_name: identifier,
      email: identifier.includes('@') ? identifier : null,
      phone: identifier.includes('@') ? null : identifier,
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    throw new Error(error.message);
  }
}

async function readSupabaseProfile(role: UserRole, userId: string): Promise<PatientProfile | TherapistProfile | null> {
  if (!supabase) return null;
  const table = role === 'patient' ? 'patient_profiles' : 'therapist_profiles';
  const { data, error } = await supabase.from(table).select('profile_json').eq('user_id', userId).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data?.profile_json as PatientProfile | TherapistProfile | null) ?? null;
}

async function createRehabAccount(role: UserRole, credentials: AuthCredentials): Promise<AccountSession> {
  if (supabase && credentials.identifier.includes('@')) {
    const identifier = credentials.identifier.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: identifier,
      password: credentials.password,
      options: {
        data: { role },
      },
    });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.user?.id) {
      throw new Error('Supabase did not return a user id. Check email confirmation settings.');
    }
    await upsertSupabaseBaseProfile(data.user.id, role, identifier);
    return { userId: data.user.id, role, identifier };
  }
  return postJson<AccountSession>('/api/rehab/accounts', {
    role,
    identifier: credentials.identifier.trim(),
    password: credentials.password,
  });
}

async function loginRehabAccount(
  role: UserRole,
  credentials: AuthCredentials,
): Promise<AccountSession & { profile?: PatientProfile | TherapistProfile | null }> {
  if (supabase && credentials.identifier.includes('@')) {
    const identifier = credentials.identifier.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: credentials.password,
    });
    if (error) {
      throw new Error(error.message);
    }
    const userId = data.user?.id;
    if (!userId) {
      throw new Error('Supabase login did not return a user id.');
    }
    let profile: PatientProfile | TherapistProfile | null | undefined;
    try {
      profile = await withTimeout<PatientProfile | TherapistProfile | null | undefined>(
        readSupabaseProfile(role, userId),
        1200,
        undefined,
      );
    } catch (profileError) {
      reportInternalError('Supabase profile read after login failed', profileError);
    }
    return { userId, role, identifier, profile };
  }
  return postJson<AccountSession & { profile?: PatientProfile | TherapistProfile | null }>('/api/rehab/login', {
    role,
    identifier: credentials.identifier.trim(),
    password: credentials.password,
  });
}

async function saveRehabProfile(role: UserRole, userId: string, profile: PatientProfile | TherapistProfile) {
  if (supabase) {
    if (role === 'patient') {
      const row = patientProfileToSupabaseRow(userId, profile as PatientProfile);
      const { error } = await supabase.from('patient_profiles').upsert(row, { onConflict: 'user_id' });
      if (error) throw new Error(error.message);
      return { userId, role, profile };
    }
    const row = therapistProfileToSupabaseRow(userId, profile as TherapistProfile);
    const { error } = await supabase.from('therapist_profiles').upsert(row, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
    return { userId, role, profile };
  }
  return postJson('/api/rehab/profiles', { role, userId, profile });
}

async function saveUpperLimbAnalysis(
  patientUserId: string | null,
  patientProfile: PatientProfile,
  recordedVideos: Record<string, string>,
  result: UpperLimbAnalysisResult,
): Promise<{ analysisId: string; createdAt: string }> {
  return postJson<{ analysisId: string; createdAt: string }>('/api/rehab/upper-limb-analyses', {
    patientUserId,
    patientProfile,
    recordedVideos,
    result,
  });
}

async function saveExercisePlan(
  patientUserId: string | null,
  analysisId: string | null,
  packageKey: string,
  result: UpperLimbAnalysisResult,
): Promise<{ planId: string; status: string; createdAt: string }> {
  return postJson<{ planId: string; status: string; createdAt: string }>('/api/rehab/exercise-plans', {
    patientUserId,
    analysisId,
    packageKey,
    plan: {
      algorithmVersion: result.algorithmVersion,
      weeklyExercisePlan: result.weeklyExercisePlan,
      functionalProblems: result.functionalProblems,
      patientFacingSummary: result.patientFacingSummary,
    },
    status: 'pending_therapist_review',
  });
}

async function saveCareMatch(
  patientUserId: string | null,
  analysisId: string | null,
  matchedPerson: MatchedPerson,
): Promise<{ matchId: string; status: string; createdAt: string }> {
  return postJson<{ matchId: string; status: string; createdAt: string }>('/api/rehab/matches', {
    patientUserId,
    analysisId,
    matchedPerson,
    status: 'waiting_for_therapist',
  });
}

async function saveFeedbackSuggestion(
  patientUserId: string | null,
  authorRole: string,
  category: string,
  message: string,
  contactPermission: boolean,
  appContext: Record<string, unknown>,
): Promise<{ feedbackId: string; status: string; createdAt: string }> {
  return postJson<{ feedbackId: string; status: string; createdAt: string }>('/api/rehab/feedback', {
    patientUserId,
    authorRole,
    category,
    message,
    contactPermission,
    appContext,
  });
}

async function requestAvailableTherapists(): Promise<Array<{ userId: string; identifier: string; profile: TherapistProfile }>> {
  const response = await fetch(`${apiBaseUrl}/api/rehab/therapists`);
  if (!response.ok) {
    throw new PatientSafeApiError('康复师搜索失败，请重试。', response.status, `HTTP ${response.status}`);
  }
  const body = await response.json();
  return (body.therapists ?? []) as Array<{ userId: string; identifier: string; profile: TherapistProfile }>;
}

const defaultPatientProfile: PatientProfile = {
  fullName: '演示患者',
  ageRange: '55-64',
  gender: '不便透露',
  language: '中文',
  location: '伦敦 / GMT',
  strokeType: 'Unknown',
  onsetTime: '6个月以上',
  affectedSide: '右侧',
  dominantHand: '右侧',
  mobilityLevel: '需要一定协助',
  upperLimbAbility: '手臂可部分抬起，抓握受限',
  safetyFlags: ['肩痛'],
  mainGoal: '在日常活动中使用患侧手臂',
  supportMode: '远程',
};

const defaultTherapistProfile: TherapistProfile = {
  fullName: '陈雨晴',
  title: '神经康复治疗师',
  profession: '物理治疗师',
  location: '伦敦 / GMT',
  languages: '中文、英文',
  yearsExperience: '8+ years',
  strokeExperience: '5+ years',
  specialties: ['上肢康复', '手功能', '居家训练方案', '远程康复'],
  assessments: ['Fugl-Meyer 上肢评估', 'ARAT', 'WMFT'],
  supportMode: '远程',
  availability: '工作日及周六上午',
};

const patientOptionSets = {
  ageRange: ['45-54', '55-64', '65-74'],
  gender: ['女', '男', '不便透露'],
  strokeType: ['缺血性', '出血性', '不确定'],
  onsetTime: ['0-3个月', '3-6个月', '6个月以上'],
  affectedSide: ['左侧', '右侧', '双侧/不确定'],
  dominantHand: ['左侧', '右侧', '双侧/不确定'],
  mobilityLevel: ['可独立活动', '需要一定协助', '主要使用轮椅'],
  supportMode: ['远程', '线下', '均可'],
};

const therapistOptionSets = {
  profession: ['物理治疗师', '作业治疗师', '康复医师'],
  yearsExperience: ['1-2年', '3-5年', '8年以上'],
  strokeExperience: ['1-2年', '3-5年', '5年以上'],
  supportMode: ['远程', '线下', '线上线下结合'],
};

function tapStyle(base: StyleProp<ViewStyle>) {
  return ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => [base, pressed && styles.tapFeedback];
}

function createFallbackAnalysis(): UpperLimbAnalysisResult {
  return {
    algorithmVersion: 'local-fallback-v0',
    qualitySummary: { failed: [], review: [], missingMetrics: [], meanConfidence: 82 },
    functionalProblems: demoProblems.map((problem, index) => ({
      id: ['limited_active_shoulder_elevation', 'trunk_or_scapular_compensation', 'wrist_hand_release_difficulty'][index],
      title: problem.title,
      severity: index === 0 ? 'moderate' : 'mild',
      patient_summary: problem.summary,
      daily_life_impact: index === 0 ? ['reaching overhead', 'washing face or hair'] : index === 1 ? ['reaching forward', 'controlled arm use'] : ['holding cups', 'releasing objects'],
      evidence: ['完整分析未完成，当前显示安全演示结果。'],
    })),
    opensimDecision: {
      needed: false,
      priority: 'analysis_not_completed',
      reasons: ['Full analysis was not completed; showing a safe demo result only.'],
      recommended_workflow: ['请在网络稳定后重试。'],
    },
    weeklyExercisePlan: exercises.map((exercise) => ({
      exercise_id: exercise.id,
      name: exercise.title,
      improves: [exercise.improves.replace(/^Improves\s+/i, '').replace(/^Reduces\s+/i, '')],
      dose: exercise.dose,
      days: weekDays,
      instructions: exercise.steps,
      precautions: exercise.cautions,
      progression: '只有在动作可控且无痛时再进阶。',
    })),
    patientFacingSummary: {
      title: '你的上肢训练重点',
      problems: demoProblems.map((problem) => problem.summary),
      trainingFocus: exercises.map((exercise) => exercise.title),
      reviewNote: '这是演示结果。用于训练决策前请先完成完整分析。',
    },
  };
}

function iconForProblem(problemId: string): keyof typeof Ionicons.glyphMap {
  if (problemId.includes('shoulder')) return 'body';
  if (problemId.includes('compensation')) return 'git-compare';
  if (problemId.includes('wrist') || problemId.includes('hand')) return 'hand-left';
  if (problemId.includes('reach') || problemId.includes('elbow')) return 'radio-button-on';
  return 'analytics';
}

function imageForProblem(problemId: string): ImageSourcePropType {
  if (problemId.includes('compensation') || problemId.includes('scapular') || problemId.includes('trunk')) return require('./assets/problem-illustrations/trunk-compensation.png');
  if (problemId.includes('wrist') || problemId.includes('hand') || problemId.includes('release')) return require('./assets/problem-illustrations/wrist-release.png');
  return require('./assets/problem-illustrations/limited-elevation.png');
}

function toneForExercise(exerciseKey: string): { imageTone: string; coverImage: ImageSourcePropType } {
  const key = exerciseKey.toLowerCase();
  if (key.includes('scapular') || key.includes('scapula')) return { imageTone: '#eaf2ff', coverImage: require('./assets/exercise-covers/scapula-setting-generated.png') };
  if (key.includes('wrist') || key.includes('grasp') || key.includes('open') || key.includes('release')) return { imageTone: '#ffe9df', coverImage: require('./assets/exercise-covers/wrist-open-generated.png') };
  if (key.includes('target') || key.includes('touch') || key.includes('coordination') || key.includes('reach') || key.includes('elbow')) return { imageTone: '#fff4db', coverImage: require('./assets/exercise-covers/elbow-reach-generated.png') };
  return { imageTone: '#dff7ff', coverImage: require('./assets/exercise-covers/table-slide-generated.png') };
}

function demoVideoForExercise(exerciseId: string): string | undefined {
  return undefined;
}

function translateExerciseTitle(id: string, title: string): string {
  const labels: Record<string, string> = {
    table_slide_forward_elevation: '桌面滑手前举',
    scapular_setting: '肩胛稳定训练',
    seated_elbow_extension_reach: '坐位肘伸展够物',
    wrist_lift_hand_opening: '腕背伸与张手训练',
  };
  const normalized = id.toLowerCase();
  if (labels[normalized]) return labels[normalized];
  if (normalized.includes('scap')) return '肩胛稳定训练';
  if (normalized.includes('wrist') || normalized.includes('hand')) return '腕背伸与张手训练';
  if (normalized.includes('elbow') || normalized.includes('reach') || normalized.includes('target')) return '坐位肘伸展够物';
  if (normalized.includes('table') || normalized.includes('shoulder')) return '桌面滑手前举';
  return title;
}

function translateExerciseText(text: string): string {
  const labels: Record<string, string> = {
    'Progress only when movement is controlled and pain-free.': '只有在动作可控且无痛时再进阶。',
    'Keep the body upright and slowly slide the affected hand forward.': '保持身体直立，慢慢将患侧手向前滑。',
    'Pause for 2 seconds at a controllable range, then slide back.': '在可控制范围内停留2秒，再滑回。',
    'Sit with both shoulders relaxed.': '双肩放松坐好。',
    'Do not hike the shoulder.': '不要耸肩。',
    'Do not lean backward to replace arm lifting.': '不要用后仰代替抬手。',
    'Breathe naturally.': '自然呼吸。',
    'Stop if shoulder pain is obvious.': '如肩痛明显，请停止。',
    'Touch the target, then return steadily.': '触碰目标后平稳返回。',
    'Open the fingers and hold for 2 seconds.': '张开手指并保持2秒。',
    'Do not hold your breath.': '不要憋气。',
    'Reduce reps if finger spasticity is obvious.': '如果手指痉挛明显，请减少次数。',
  };
  return labels[text] ?? text.replace(/_/g, ' ');
}

function mapApiExercise(item: ApiExercisePlanItem): Exercise {
  const tone = toneForExercise(`${item.exercise_id} ${item.name} ${item.improves.join(' ')}`);
  return {
    id: item.exercise_id,
    title: translateExerciseTitle(item.exercise_id, item.name),
    improves: patientFriendlyImproves(item.improves),
    dose: item.dose,
    dayPattern: item.days
      .map((day) => weekDays.findIndex((value) => value === day) + 1)
      .filter((day) => day > 0),
    imageTone: tone.imageTone,
    coverImage: tone.coverImage,
    demoVideoUrl: demoVideoForExercise(item.exercise_id),
    steps: item.instructions.map(translateExerciseText),
    cautions: item.precautions.map(translateExerciseText),
  };
}

function patientFriendlyImproves(items: string[]): string {
  const labels: Record<string, string> = {
    limited_active_shoulder_elevation: '抬手和够物能力',
    trunk_or_scapular_compensation: '手臂运动时保持身体稳定',
    wrist_hand_release_difficulty: '张开手并释放物体',
    elbow_extension_control: '伸肘够物',
    forearm_rotation_limitation: '手掌上下翻转',
    upper_limb_coordination_deficit: '手部精准控制和协调',
  };
  const readable = items.map((item) => labels[item] ?? item.replace(/_/g, ' '));
  return `改善 ${readable.join(', ')}`;
}

function translateProblemTitle(id: string, title: string): string {
  const labels: Record<string, string> = {
    limited_active_shoulder_elevation: '主动上举受限',
    trunk_or_scapular_compensation: '明显躯干/肩胛代偿',
    wrist_hand_release_difficulty: '腕背伸和释放较弱',
    elbow_extension_control: '肘伸展控制不足',
    forearm_rotation_limitation: '前臂旋转受限',
    upper_limb_coordination_deficit: '上肢协调性较弱',
  };
  return labels[id] ?? title;
}

function translateProblemSummary(id: string, summary: string): string {
  const labels: Record<string, string> = {
    limited_active_shoulder_elevation: '患侧手臂上举时容易提前停止',
    trunk_or_scapular_compensation: '抬手或够物时身体会明显帮忙代偿',
    wrist_hand_release_difficulty: '抓握后张开手不够顺畅',
    elbow_extension_control: '向前够物时肘部伸直控制不足',
    forearm_rotation_limitation: '手掌向上或向下翻转不够充分',
    upper_limb_coordination_deficit: '触碰目标时准确性和协调性不足',
  };
  return labels[id] ?? summary;
}

function formatSeverity(severity: string): string {
  const labels: Record<string, string> = {
    mild: '轻度',
    moderate: '中度',
    severe: '重度',
  };
  return labels[severity.toLowerCase()] ?? severity;
}

function translateVideoTip(message?: string): string | undefined {
  if (!message) return undefined;
  if (message.includes('full upper body') || message.includes('arm') || message.includes('shoulder') || message.includes('elbow') || message.includes('wrist')) {
    return '请后退一点，并确保上半身、患侧肩、肘、腕和手都在画面内。';
  }
  if (message.includes('lighting') || message.includes('bright')) return '请打开更亮的灯光，并保持手机稳定。';
  if (message.includes('network')) return '网络连接不稳定，请稍后重试。';
  return message;
}

async function requestUpperLimbAnalysis(
  patientProfile: PatientProfile,
  recordedVideos: Record<string, string>,
  patientUserId?: string | null,
): Promise<UpperLimbAnalysisResult> {
  const formData = new FormData();
  formData.append('patient_profile_json', JSON.stringify(patientProfile));
  if (patientUserId) {
    formData.append('patient_user_id', patientUserId);
  }
  formData.append('affected_side', patientProfile.affectedSide === '双侧/不确定' ? 'auto' : patientProfile.affectedSide.toLowerCase());
  const uploadedActionIds: string[] = [];

  Object.entries(recordedVideos).forEach(([appActionId, uri]) => {
    const apiActionId = actionIdToApiId[appActionId] ?? appActionId;
    uploadedActionIds.push(apiActionId);
    formData.append('videos', {
      uri,
      name: `${apiActionId}.mov`,
      type: 'video/quicktime',
    } as any);
  });
  formData.append('action_ids_json', JSON.stringify(uploadedActionIds));

  const response = await fetch(`${apiBaseUrl}/api/upper-limb/analyze-videos`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new PatientSafeApiError('Analysis failed. Please try again.', response.status, `HTTP ${response.status}`);
  }
  return (await response.json()) as UpperLimbAnalysisResult;
}

async function requestVideoQualityCheck(
  actionId: string,
  uri: string,
  affectedSide: string,
): Promise<VideoQualityResult> {
  const apiActionId = actionIdToApiId[actionId] ?? actionId;
  const formData = new FormData();
  formData.append('action_id', apiActionId);
  formData.append('affected_side', affectedSide === '双侧/不确定' ? 'auto' : affectedSide.toLowerCase());
  formData.append('video', {
    uri,
    name: `${apiActionId}_quality.mov`,
    type: 'video/quicktime',
  } as any);

  const response = await fetch(`${apiBaseUrl}/api/upper-limb/quality-check-video`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    let internalDetail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      internalDetail = getBackendDetail(body, internalDetail);
    } catch {
      // Keep the HTTP status when the backend does not return JSON.
    }
    throw new PatientSafeApiError('Video quality check failed. Please try again.', response.status, internalDetail);
  }
  return (await response.json()) as VideoQualityResult;
}

async function requestFrameCheck(
  actionId: string,
  uri: string,
  affectedSide: string,
): Promise<FrameCheckResult> {
  const apiActionId = actionIdToApiId[actionId] ?? actionId;
  const formData = new FormData();
  formData.append('action_id', apiActionId);
  formData.append('affected_side', affectedSide === '双侧/不确定' ? 'auto' : affectedSide.toLowerCase());
  formData.append('image', {
    uri,
    name: `${apiActionId}_frame.jpg`,
    type: 'image/jpeg',
  } as any);

  const response = await fetch(`${apiBaseUrl}/api/upper-limb/frame-check`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    let internalDetail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      internalDetail = getBackendDetail(body, internalDetail);
    } catch {
      // Keep the HTTP status when the backend does not return JSON.
    }
    throw new PatientSafeApiError('Position check failed. Please try again.', response.status, internalDetail);
  }
  return (await response.json()) as FrameCheckResult;
}

async function playCompletionDing() {
  try {
    const { sound } = await Audio.Sound.createAsync({
      uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
    });
    await sound.playAsync();
    setTimeout(() => {
      sound.unloadAsync().catch(() => undefined);
    }, 1600);
  } catch {
    // Audio is a patient convenience; analysis completion should not depend on it.
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(defaultPatientProfile);
  const [therapistProfile, setTherapistProfile] = useState<TherapistProfile>(defaultTherapistProfile);
  const [accountSession, setAccountSession] = useState<AccountSession | null>(null);
  const [patientOnboardingBackScreen, setPatientOnboardingBackScreen] = useState<Screen>('auth');
  const [authBusy, setAuthBusy] = useState(false);
  const [authRestoring, setAuthRestoring] = useState(true);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageKey | null>(null);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [recordedVideos, setRecordedVideos] = useState<Record<string, string>>({});
  const [qualityPassed, setQualityPassed] = useState<Record<string, boolean>>({});
  const [qualityResults, setQualityResults] = useState<Record<string, VideoQualityResult>>({});
  const [qualityCheckingActionId, setQualityCheckingActionId] = useState<string | null>(null);
  const [qualityCheckingActions, setQualityCheckingActions] = useState<Record<string, boolean>>({});
  const [frameCheckResults, setFrameCheckResults] = useState<Record<string, FrameCheckResult>>({});
  const [frameCheckingActionId, setFrameCheckingActionId] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraOpen, setCameraOpen] = useState(false);
  const [isRecording, setRecording] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [selectedGuideAction, setSelectedGuideAction] = useState<CollectionAction>(activeUpperActions[0]);
  const [showDemo, setShowDemo] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<UpperLimbAnalysisResult | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  const currentAction = activeUpperActions[currentActionIndex];
  const completedCount = activeUpperActions.filter((action) => qualityPassed[action.id]).length;
  const canGeneratePlan = completedCount === activeUpperActions.length;
  const analysisExercises = useMemo(
    () => (analysisResult?.weeklyExercisePlan.length ? analysisResult.weeklyExercisePlan.map(mapApiExercise) : exercises),
    [analysisResult],
  );
  const dayExercises = useMemo(() => analysisExercises.filter((exercise) => exercise.dayPattern.includes(selectedDay)), [analysisExercises, selectedDay]);
  const matchedTherapist = useMemo<MatchedPerson>(() => {
    const languageFit = therapistProfile.languages.toLowerCase().includes(patientProfile.language.toLowerCase());
    const remoteFit = therapistProfile.supportMode === '线上线下结合' || therapistProfile.supportMode === patientProfile.supportMode;
    const score = 82 + (languageFit ? 6 : 0) + (remoteFit ? 5 : 0) + (therapistProfile.specialties.includes('上肢康复') ? 4 : 0);

    return {
      name: therapistProfile.fullName || matchedPerson.name,
      title: therapistProfile.title || matchedPerson.title,
      organization: `${therapistProfile.location || '远程'} · ${therapistProfile.supportMode}支持`,
      matchScore: `${Math.min(score, 98)}%`,
      tags: [
        patientProfile.mainGoal.includes('手') ? '手功能' : '脑卒中上肢康复',
        patientProfile.supportMode,
        patientProfile.affectedSide === '双侧/不确定' ? '双侧复核' : `${patientProfile.affectedSide}重点`,
      ],
      experience: [
        `${therapistProfile.yearsExperience}康复经验，${therapistProfile.strokeExperience}卒中康复重点经验。`,
        `熟悉 ${therapistProfile.assessments.join(', ')} 等上肢功能评估。`,
        `与你的目标匹配：${patientProfile.mainGoal}。`,
      ],
      focus: ['主动肩上举受限', '肩胛和躯干代偿', '腕背伸与抓握释放控制'],
    };
  }, [patientProfile, therapistProfile]);
  const activePatientTab = useMemo<PatientTab>(() => {
    if (screen === 'assessment' || screen === 'collect' || screen === 'collectionGuide' || screen === 'analysisLoading' || screen === 'metrics' || screen === 'problems') return 'assessment';
    if (screen === 'planLoading' || screen === 'plan' || screen === 'demo' || screen === 'patient训练') return 'training';
    if (screen === 'match' || screen === 'profile' || screen === 'waiting' || screen === 'patientCare') return 'care';
    if (screen === 'patient我的') return 'me';
    return 'home';
  }, [screen]);
  const showPatientTabs =
    accountSession?.role === 'patient'
    && !['welcome', 'auth', 'patientOnboarding', 'therapistOnboarding', 'therapistDashboard', 'analysisLoading', 'planLoading', 'demo', 'collectionGuide'].includes(screen);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      if (!supabase) {
        if (mounted) setAuthRestoring(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        const role = user?.user_metadata?.role as UserRole | undefined;
        const identifier = user?.email ?? user?.phone ?? '';
        if (!mounted || !user?.id || (role !== 'patient' && role !== 'therapist')) {
          return;
        }
        const profile = await withTimeout<PatientProfile | TherapistProfile | null | undefined>(
          readSupabaseProfile(role, user.id),
          1200,
          undefined,
        );
        if (!mounted) return;
        setSelectedRole(role);
        setAccountSession({ userId: user.id, role, identifier });
        if (role === 'patient') {
          if (profile) {
            setPatientProfile(profile as PatientProfile);
            setScreen('home');
          } else if (profile === undefined) {
            setScreen('home');
            readSupabaseProfile(role, user.id)
              .then((freshProfile) => {
                if (mounted && freshProfile) setPatientProfile(freshProfile as PatientProfile);
              })
              .catch((error) => reportInternalError('Background patient profile restore failed', error));
          } else {
            setPatientOnboardingBackScreen('auth');
            setScreen('patientOnboarding');
          }
        } else if (profile) {
          setTherapistProfile(profile as TherapistProfile);
          setScreen('therapistDashboard');
        } else if (profile === undefined) {
          setScreen('therapistDashboard');
          readSupabaseProfile(role, user.id)
            .then((freshProfile) => {
              if (mounted && freshProfile) setTherapistProfile(freshProfile as TherapistProfile);
            })
            .catch((error) => reportInternalError('Background therapist profile restore failed', error));
        } else {
          setScreen('therapistOnboarding');
        }
      } catch {
        // Session restore is a convenience; manual login remains available.
      } finally {
        if (mounted) setAuthRestoring(false);
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const chooseRole = (role: UserRole) => {
    setSelectedRole(role);
    setScreen('auth');
  };

  const goToPatientTab = (tab: PatientTab) => {
    if (tab === 'home') {
      setScreen('home');
      return;
    }
    if (tab === 'assessment') {
      setScreen('assessment');
      return;
    }
    if (tab === 'training') {
      setScreen(analysisResult ? 'plan' : 'patient训练');
      return;
    }
    if (tab === 'care') {
      setScreen(matchId ? 'waiting' : 'patientCare');
      return;
    }
    setScreen('patient我的');
  };

  const requireCredentials = (credentials: AuthCredentials) => {
    if (!credentials.identifier.trim() || credentials.password.length < 4) {
      Alert.alert('需要账号信息', '请输入邮箱或手机号，密码至少 4 位。');
      return false;
    }
    return true;
  };

  const loginExistingAccount = async (credentials: AuthCredentials) => {
    if (!requireCredentials(credentials)) {
      return;
    }
    setAuthBusy(true);
    try {
      const session = await loginRehabAccount(selectedRole, credentials);
      setAccountSession({ userId: session.userId, role: session.role, identifier: session.identifier });
      if (selectedRole === 'patient') {
        if (session.profile) {
          setPatientProfile(session.profile as PatientProfile);
          setScreen('home');
        } else if (session.profile === undefined) {
          setScreen('home');
          readSupabaseProfile('patient', session.userId)
            .then((freshProfile) => {
              if (freshProfile) setPatientProfile(freshProfile as PatientProfile);
            })
            .catch((error) => reportInternalError('Background patient profile load after login failed', error));
        } else {
          setPatientOnboardingBackScreen('auth');
          setScreen('patientOnboarding');
        }
        return;
      }
      if (session.profile) {
        setTherapistProfile(session.profile as TherapistProfile);
        setScreen('therapistDashboard');
      } else if (session.profile === undefined) {
        setScreen('therapistDashboard');
        readSupabaseProfile('therapist', session.userId)
          .then((freshProfile) => {
            if (freshProfile) setTherapistProfile(freshProfile as TherapistProfile);
          })
          .catch((error) => reportInternalError('Background therapist profile load after login failed', error));
      } else {
        setScreen('therapistOnboarding');
      }
    } catch (error) {
      showFriendlyError(
        '登录失败',
        '暂时无法登录。请检查邮箱和密码后重试。',
        '患者/therapist login failed',
        error,
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const createAccount = async (credentials: AuthCredentials) => {
    if (!requireCredentials(credentials)) {
      return;
    }
    setAuthBusy(true);
    try {
      const session = await createRehabAccount(selectedRole, credentials);
      setAccountSession(session);
      if (selectedRole === 'patient') {
        setPatientOnboardingBackScreen('auth');
      }
      setScreen(selectedRole === 'patient' ? 'patientOnboarding' : 'therapistOnboarding');
    } catch (error) {
      showFriendlyError(
        '账号创建失败',
        '暂时无法创建账号。请检查信息后重试。',
        '账号创建失败',
        error,
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const completePatientOnboarding = async (profile: PatientProfile) => {
    setPatientProfile(profile);
    if (accountSession?.role === 'patient') {
      try {
        await saveRehabProfile('patient', accountSession.userId, profile);
      } catch (error) {
        showFriendlyError(
          '资料保存失败',
          '暂时无法保存资料。请检查网络后重试。',
          '患者 profile save failed',
          error,
        );
        return;
      }
    }
    setScreen('home');
  };

  const logoutPatient = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAccountSession(null);
    setScreen('welcome');
  };

  const completeTherapistOnboarding = async (profile: TherapistProfile) => {
    setTherapistProfile(profile);
    if (accountSession?.role === 'therapist') {
      try {
        await saveRehabProfile('therapist', accountSession.userId, profile);
      } catch (error) {
        showFriendlyError(
        '资料保存失败',
        '暂时无法保存资料。请检查网络后重试。',
          '康复师 profile save failed',
          error,
        );
        return;
      }
    }
    setScreen('therapistDashboard');
  };

  const openCreateAccount = () => {
    setScreen(selectedRole === 'patient' ? 'patientOnboarding' : 'therapistOnboarding');
  };

  const openPackage = (pkg: RehabPackage) => {
    if (!pkg.active) {
      Alert.alert('即将开放', `${pkg.title} will be available soon.`);
      return;
    }
    setSelectedPackage(pkg.key);
    setScreen('collect');
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('需要摄像头权限', '请允许摄像头权限后再采集动作视频。');
        return;
      }
    }
    setCameraOpen(true);
  };

  const runQualityCheck = async (action: CollectionAction, actionIndex: number, uri: string) => {
    setQualityCheckingActionId(action.id);
    setQualityCheckingActions((prev) => ({ ...prev, [action.id]: true }));
    setQualityPassed((prev) => ({ ...prev, [action.id]: false }));
    setQualityResults((prev) => {
      const next = { ...prev };
      delete next[action.id];
      return next;
    });
    try {
      const result = await requestVideoQualityCheck(action.id, uri, patientProfile.affectedSide);
      setQualityResults((prev) => ({ ...prev, [action.id]: result }));
      if (result.passed) {
        setQualityPassed((prev) => ({ ...prev, [action.id]: true }));
        return;
      }
      setQualityPassed((prev) => ({ ...prev, [action.id]: false }));
    } catch (error) {
      reportInternalError('Video quality check failed', error);
      const fallback: VideoQualityResult = {
        actionId: action.id,
        passed: false,
        status: 'fail',
        score: 0,
        patientMessage: '暂时无法完成视频质量检查。',
        issues: ['质量检查失败。'],
        tips: ['请检查网络，确保完整上半身入镜后重新录制。'],
      };
      setQualityResults((prev) => ({ ...prev, [action.id]: fallback }));
      setQualityPassed((prev) => ({ ...prev, [action.id]: false }));
    } finally {
      setQualityCheckingActionId(null);
      setQualityCheckingActions((prev) => ({ ...prev, [action.id]: false }));
    }
  };

  const runFrameCheck = async (action: CollectionAction) => {
    setFrameCheckingActionId(action.id);
    setFrameCheckResults((prev) => {
      const next = { ...prev };
      delete next[action.id];
      return next;
    });
    try {
      const picture = await cameraRef.current?.takePictureAsync({
        quality: 0.35,
        skipProcessing: true,
      });
      if (!picture?.uri) {
        throw new Error('Camera preview snapshot was not available.');
      }
      const result = await requestFrameCheck(action.id, picture.uri, patientProfile.affectedSide);
      setFrameCheckResults((prev) => ({ ...prev, [action.id]: result }));
      return result;
    } catch (error) {
      reportInternalError('Pre-recording frame check failed', error);
      const fallback: FrameCheckResult = {
        actionId: action.id,
        passed: true,
        status: 'ready',
        score: 60,
        patientMessage: '可以开始.',
        tips: [],
      };
      setFrameCheckResults((prev) => ({ ...prev, [action.id]: fallback }));
      return fallback;
    } finally {
      setFrameCheckingActionId(null);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    const action = currentAction;
    const actionIndex = currentActionIndex;
    try {
      const frameResult = frameCheckResults[action.id];
      if (frameResult && !frameResult.passed) {
        return;
      }
      setRecording(true);
      const video = await cameraRef.current.recordAsync();
      if (video?.uri) {
        setRecordedVideos((prev) => ({ ...prev, [action.id]: video.uri }));
        setRecording(false);
        runQualityCheck(action, actionIndex, video.uri);
        if (actionIndex < activeUpperActions.length - 1) {
          setTimeout(() => setCurrentActionIndex(actionIndex + 1), 350);
        }
      }
    } catch {
      Alert.alert('录制失败', '请重新打开摄像头并再次录制。');
    } finally {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const retryAction = () => {
    setRecordedVideos((prev) => {
      const next = { ...prev };
      delete next[currentAction.id];
      return next;
    });
    setQualityPassed((prev) => ({ ...prev, [currentAction.id]: false }));
    setQualityResults((prev) => {
      const next = { ...prev };
      delete next[currentAction.id];
      return next;
    });
    setFrameCheckResults((prev) => {
      const next = { ...prev };
      delete next[currentAction.id];
      return next;
    });
  };

  useEffect(() => {
    if (screen !== 'collect' || !isCameraOpen || isRecording || qualityCheckingActions[currentAction.id] || frameCheckResults[currentAction.id] || frameCheckingActionId === currentAction.id) {
      return undefined;
    }
    const timer = setTimeout(() => {
      runFrameCheck(currentAction);
    }, 500);
    return () => clearTimeout(timer);
  }, [screen, isCameraOpen, isRecording, currentAction.id, frameCheckResults, frameCheckingActionId, qualityCheckingActions]);

  const generatePlan = async () => {
    if (!canGeneratePlan) {
    Alert.alert('暂不可用', '请先完成所有上肢动作录制并通过视频质量检查。');
      return;
    }
    setAnalysisReady(false);
    setAnalysisId(null);
    setScreen('analysisLoading');
    try {
      const patientUserId = accountSession?.role === 'patient' ? accountSession.userId : null;
      const result = await requestUpperLimbAnalysis(patientProfile, recordedVideos, patientUserId);
      setAnalysisResult(result);
      try {
        const saved = await saveUpperLimbAnalysis(
          accountSession?.role === 'patient' ? accountSession.userId : null,
          patientProfile,
          recordedVideos,
          result,
        );
        setAnalysisId(saved.analysisId);
        await saveExercisePlan(
          accountSession?.role === 'patient' ? accountSession.userId : null,
          saved.analysisId,
          'upper',
          result,
        );
      } catch (saveError) {
        reportInternalError('Analysis save failed after plan generation', saveError);
      Alert.alert('分析已保存在本设备', '训练计划已生成，但暂时无法同步到账号。');
      }
      setAnalysisReady(true);
      await playCompletionDing();
    } catch (error) {
      reportInternalError('Upper-limb analysis failed', error);
      setAnalysisReady(false);
      setScreen('collect');
      Alert.alert(
        '分析失败',
        '暂时无法分析这些视频。请检查网络后重试。',
      );
    }
  };

  const confirmTherapistMatch = async () => {
    try {
      const saved = await saveCareMatch(
        accountSession?.role === 'patient' ? accountSession.userId : null,
        analysisId,
        matchedTherapist,
      );
      setMatchId(saved.matchId);
      setScreen('waiting');
    } catch (error) {
      showFriendlyError(
        '匹配保存失败',
        '暂时无法发送匹配请求。请稍后重试。',
        '照护匹配保存失败',
        error,
      );
    }
  };

  const startTherapistMatch = async () => {
    setScreen('match');
  };

  const completeTherapistSearch = async () => {
    try {
      const therapists = await requestAvailableTherapists();
      if (!therapists.length) {
        setScreen('plan');
        Alert.alert('未找到康复师');
        return;
      }
      setTherapistProfile(therapists[0].profile);
      setScreen('profile');
    } catch (error) {
      setScreen('plan');
      showFriendlyError(
        '康复师 Search Failed',
          '暂时无法查询康复师，请稍后重试。',
        '康复师 search failed',
        error,
      );
    }
  };

  return (
    <LinearGradient colors={['#061428', '#0a203a', '#f6f9ff']} locations={[0, 0.36, 1]} style={styles.app}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        {screen === 'welcome' && <WelcomeScreen onSelectRole={chooseRole} />}
        {screen === 'auth' && (
          <AuthScreen
            role={selectedRole}
            onBack={() => setScreen('welcome')}
            onLogin={loginExistingAccount}
            onCreate={createAccount}
            busy={authBusy || authRestoring}
          />
        )}
        {screen === 'patientOnboarding' && (
          <PatientOnboardingScreen
            initialProfile={patientProfile}
            onBack={() => setScreen(patientOnboardingBackScreen)}
            onComplete={completePatientOnboarding}
          />
        )}
        {screen === 'therapistOnboarding' && (
          <TherapistOnboardingScreen
            initialProfile={therapistProfile}
            onBack={() => setScreen('auth')}
            onComplete={completeTherapistOnboarding}
          />
        )}
        {screen === 'therapistDashboard' && (
          <TherapistDashboardScreen
            profile={therapistProfile}
            onBack={() => setScreen('welcome')}
          />
        )}
        {screen === 'home' && (
          <HomeScreen
            patientProfile={patientProfile}
            analysisResult={analysisResult}
            onOpenStrokeEducation={() => setScreen('strokeEducation')}
            onOpenPeerSupport={() => setScreen('peerSupport')}
            onOpenFeedback={() => setScreen('feedback')}
          />
        )}
        {screen === 'strokeEducation' && <EducationDetailScreen kind="basics" onBack={() => setScreen('home')} />}
        {screen === 'peerSupport' && <EducationDetailScreen kind="support" onBack={() => setScreen('home')} />}
        {screen === 'feedback' && (
          <FeedbackScreen
            patientUserId={accountSession?.role === 'patient' ? accountSession.userId : null}
            analysisResult={analysisResult}
            onBack={() => setScreen('home')}
          />
        )}
        {screen === 'assessment' && <AssessmentScreen onOpenPackage={openPackage} />}
        {screen === 'patient训练' && (
          <PatientTrainingScreen
            hasPlan={Boolean(analysisResult)}
            onStartAssessment={() => setScreen('assessment')}
            onOpenPlan={() => setScreen('plan')}
          />
        )}
        {screen === 'patientCare' && (
          <PatientCareScreen
            person={matchedTherapist}
            matchId={matchId}
            onStartMatch={startTherapistMatch}
            onOpenProfile={() => setScreen('profile')}
          />
        )}
        {screen === 'patient我的' && (
          <PatientMeScreen
            profile={patientProfile}
            account={accountSession}
            onEditProfile={() => {
              setPatientOnboardingBackScreen('patient我的');
              setScreen('patientOnboarding');
            }}
            onLogout={logoutPatient}
          />
        )}
        {screen === 'collect' && selectedPackage === 'upper' && (
          <CollectScreen
            currentAction={currentAction}
            currentActionIndex={currentActionIndex}
            completedCount={completedCount}
            recordedVideos={recordedVideos}
            qualityPassed={qualityPassed}
            qualityResults={qualityResults}
            qualityCheckingActionId={qualityCheckingActionId}
            qualityCheckingActions={qualityCheckingActions}
            frameCheckResults={frameCheckResults}
            frameCheckingActionId={frameCheckingActionId}
            isCameraOpen={isCameraOpen}
            isRecording={isRecording}
            cameraRef={cameraRef}
            canGeneratePlan={canGeneratePlan}
            onBack={() => setScreen('home')}
            onOpenCamera={openCamera}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onRetryAction={retryAction}
            onRecheckPosition={() => runFrameCheck(currentAction)}
            onSelectAction={setCurrentActionIndex}
            onGeneratePlan={generatePlan}
            onOpenGuide={(action) => {
              setSelectedGuideAction(action);
              setShowDemo(false);
              setScreen('collectionGuide');
            }}
          />
        )}
        {screen === 'collectionGuide' && (
          <CollectionGuideScreen
            action={selectedGuideAction}
            isPlaying={showDemo}
            onBack={() => setScreen('collect')}
            onTogglePlay={() => setShowDemo((value) => !value)}
          />
        )}
        {screen === 'analysisLoading' && (
          <AnalysisLoadingScreen
            isComplete={analysisReady}
            onBack={() => setScreen('collect')}
            onComplete={() => setScreen('metrics')}
            lead="AxonAI 正在分析你的动作视频，请稍等片刻。"
            statuses={['检查动作视频', '提取关键动作指标', '生成你的功能总结']}
          />
        )}
        {screen === 'metrics' && (
          <MetricsScreen
            analysisResult={analysisResult}
            onBack={() => setScreen('collect')}
            onContinue={() => setScreen('problems')}
          />
        )}
        {screen === 'problems' && (
          <ProblemsScreen
            analysisResult={analysisResult}
            onBack={() => setScreen('collect')}
            onPlan={() => setScreen('planLoading')}
            onDemo={(exercise) => {
              setSelectedExercise(exercise);
              setScreen('demo');
            }}
          />
        )}
        {screen === 'planLoading' && (
          <WeeklyPlanLoadingScreen
            onBack={() => setScreen('problems')}
            onComplete={() => setScreen('plan')}
          />
        )}
        {screen === 'plan' && (
          <PlanScreen
            analysisResult={analysisResult}
            selectedDay={selectedDay}
            allExercises={analysisExercises}
            dayExercises={dayExercises}
            onSelectDay={setSelectedDay}
            onBack={() => setScreen('problems')}
            onMatch={startTherapistMatch}
            onDemo={(exercise) => {
              setSelectedExercise(exercise);
              setScreen('demo');
            }}
          />
        )}
        {screen === 'demo' && (
          <DemoScreen
            exercise={selectedExercise}
            isPlaying={showDemo}
            onBack={() => setScreen('plan')}
            onTogglePlay={() => setShowDemo((value) => !value)}
          />
        )}
        {screen === 'match' && <MatchScreen onBack={() => setScreen('plan')} onMatched={completeTherapistSearch} />}
        {screen === 'profile' && <ProfileScreen person={matchedTherapist} onBack={() => setScreen('plan')} onConfirm={confirmTherapistMatch} />}
        {screen === 'waiting' && <WaitingScreen person={matchedTherapist} matchId={matchId} onBack={() => setScreen('profile')} />}
        {showPatientTabs && <PatientBottomTabs activeTab={activePatientTab} onSelect={goToPatientTab} />}
      </SafeAreaView>
    </LinearGradient>
  );
}

function OptionChips({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.optionRow}>
      {options.map((option) => (
        <Pressable key={option} style={tapStyle([styles.optionChip, value === option && styles.optionChipActive])} onPress={() => onChange(option)}>
          <Text style={[styles.optionChipText, value === option && styles.optionChipTextActive]}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ToggleChips({ options, values, onToggle }: { options: string[]; values: string[]; onToggle: (value: string) => void }) {
  return (
    <View style={styles.optionRow}>
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <Pressable key={option} style={tapStyle([styles.optionChip, selected && styles.optionChipActive])} onPress={() => onToggle(option)}>
            <Text style={[styles.optionChipText, selected && styles.optionChipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8798ad"
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

function WelcomeScreen({ onSelectRole }: { onSelectRole: (role: UserRole) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Ionicons name="pulse" size={23} color="#071b33" />
          </View>
          <View>
            <Text style={styles.brandTitle}>AxonAI康复</Text>
            <Text style={styles.brandSubtitle}>居家康复流程助手</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>选择身份开始，生成更安全的康复计划</Text>
      </View>

      <Text style={styles.sectionLabel}>选择账号类型</Text>
      <View style={styles.roleGrid}>
        <Pressable style={tapStyle(styles.roleCard)} onPress={() => onSelectRole('patient')}>
          <View style={styles.roleIcon}>
            <Ionicons name="person" size={30} color="#ffffff" />
          </View>
          <View style={styles.roleCopy}>
            <Text style={styles.roleTitle}>我是患者</Text>
            <Text style={styles.roleText}>采集动作、查看功能问题，并按照每周训练计划练习。</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#1267e6" />
        </Pressable>

        <Pressable style={tapStyle(styles.roleCard)} onPress={() => onSelectRole('therapist')}>
          <View style={[styles.roleIcon, styles.roleIconTeal]}>
            <Ionicons name="medical" size={30} color="#031629" />
          </View>
          <View style={styles.roleCopy}>
            <Text style={styles.roleTitle}>我是康复师</Text>
            <Text style={styles.roleText}>创建专业资料，用于患者匹配和训练方案复核。</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#1267e6" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function AuthScreen({
  role,
  onBack,
  onLogin,
  onCreate,
  busy,
}: {
  role: UserRole;
  onBack: () => void;
  onLogin: (credentials: AuthCredentials) => void;
  onCreate: (credentials: AuthCredentials) => void;
  busy: boolean;
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const roleLabel = role === 'patient' ? '患者' : '康复师';
  const credentials = { identifier, password };
  return (
    <View style={styles.lightScreen}>
      <Header title={`${roleLabel} Account`} subtitle="登录或创建账号" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.authCard}>
          <View style={styles.authIcon}>
            <Ionicons name={role === 'patient' ? 'person-circle' : 'medkit'} size={44} color="#1267e6" />
          </View>
          <Text style={styles.authTitle}>{roleLabel} Login</Text>
            <Text style={styles.authText}>登录你的 AxonAI 康复账号。</Text>
          <FormField label="邮箱或手机号" value={identifier} onChangeText={setIdentifier} placeholder="demo@axonai.app" />
          <FormField label="密码" value={password} onChangeText={setPassword} placeholder="At least 4 characters" secureTextEntry />
          <PrimaryLightButton
            label={busy ? '登录中...' : `Login as ${roleLabel}`}
            icon="log-in"
            onPress={() => onLogin(credentials)}
            disabled={busy}
            loading={busy}
          />
        </View>

        <Pressable
          disabled={busy}
          style={({ pressed }) => [styles.createAccountCard, pressed && styles.tapFeedback, busy && styles.disabledButton]}
          onPress={() => onCreate(credentials)}
        >
          <Ionicons name="add-circle" size={24} color="#1267e6" />
          <View style={styles.createAccountCopy}>
            <Text style={styles.createAccountTitle}>{`Create New ${roleLabel} Account`}</Text>
            <Text style={styles.createAccountText}>
              Fill out the basic profile needed for rehab planning and matching.
            </Text>
          </View>
          {busy ? <ActivityIndicator color="#1267e6" /> : <Ionicons name="arrow-forward" size={20} color="#1267e6" />}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function PatientOnboardingScreen({
  initialProfile,
  onBack,
  onComplete,
}: {
  initialProfile: PatientProfile;
  onBack: () => void;
  onComplete: (profile: PatientProfile) => void;
}) {
  const [profile, setProfile] = useState<PatientProfile>(initialProfile);
  const setField = (field: keyof PatientProfile, value: string) => setProfile((prev) => ({ ...prev, [field]: value }));
  const toggleSafety = (flag: string) => {
    setProfile((prev) => ({
      ...prev,
      safetyFlags: prev.safetyFlags.includes(flag) ? prev.safetyFlags.filter((item) => item !== flag) : [...prev.safetyFlags, flag],
    }));
  };

  return (
    <View style={styles.lightScreen}>
      <Header title="患者资料" subtitle="用于更安全地制定计划和匹配康复师" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>基本信息</Text>
          <FormField label="姓名" value={profile.fullName} onChangeText={(value) => setField('fullName', value)} placeholder="请输入姓名" />
          <FormField label="语言" value={profile.language} onChangeText={(value) => setField('language', value)} placeholder="中文" />
          <FormField label="城市或时区" value={profile.location} onChangeText={(value) => setField('location', value)} placeholder="伦敦 / GMT" />
          <Text style={styles.formLabel}>年龄段</Text>
          <OptionChips options={patientOptionSets.ageRange} value={profile.ageRange} onChange={(value) => setField('ageRange', value)} />
          <Text style={styles.formLabel}>性别</Text>
          <OptionChips options={patientOptionSets.gender} value={profile.gender} onChange={(value) => setField('gender', value)} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>卒中与康复情况</Text>
          <Text style={styles.formLabel}>卒中类型</Text>
          <OptionChips options={patientOptionSets.strokeType} value={profile.strokeType} onChange={(value) => setField('strokeType', value)} />
          <Text style={styles.formLabel}>发病至今时间</Text>
          <OptionChips options={patientOptionSets.onsetTime} value={profile.onsetTime} onChange={(value) => setField('onsetTime', value)} />
          <Text style={styles.formLabel}>受影响侧</Text>
          <OptionChips options={patientOptionSets.affectedSide} value={profile.affectedSide} onChange={(value) => setField('affectedSide', value)} />
          <Text style={styles.formLabel}>卒中前优势手</Text>
          <OptionChips options={patientOptionSets.dominantHand} value={profile.dominantHand} onChange={(value) => setField('dominantHand', value)} />
          <Text style={styles.formLabel}>活动能力</Text>
          <OptionChips options={patientOptionSets.mobilityLevel} value={profile.mobilityLevel} onChange={(value) => setField('mobilityLevel', value)} />
          <FormField label="当前上肢能力" value={profile.upperLimbAbility} onChangeText={(value) => setField('upperLimbAbility', value)} placeholder="你的手臂/手现在能做什么？" />
          <FormField label="主要康复目标" value={profile.mainGoal} onChangeText={(value) => setField('mainGoal', value)} placeholder="进食、穿衣、够物、手部使用..." />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>安全与匹配</Text>
          <Text style={styles.formLabel}>安全提醒</Text>
          <ToggleChips
            options={['肩痛', '明显痉挛', '近期跌倒', '近期手术/骨折', '医学状态不稳定']}
            values={profile.safetyFlags}
            onToggle={toggleSafety}
          />
          <Text style={styles.formLabel}>偏好的支持方式</Text>
          <OptionChips options={patientOptionSets.supportMode} value={profile.supportMode} onChange={(value) => setField('supportMode', value)} />
          <View style={styles.consentNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#1267e6" />
            <Text style={styles.consentText}>原型提示：真实患者使用前，需要完善知情同意、隐私政策和安全存储。</Text>
          </View>
        </View>

        <PrimaryLightButton label="进入功能评估包" icon="arrow-forward" onPress={() => onComplete(profile)} />
      </ScrollView>
    </View>
  );
}

function TherapistOnboardingScreen({
  initialProfile,
  onBack,
  onComplete,
}: {
  initialProfile: TherapistProfile;
  onBack: () => void;
  onComplete: (profile: TherapistProfile) => void;
}) {
  const [profile, setProfile] = useState<TherapistProfile>(initialProfile);
  const setField = (field: keyof TherapistProfile, value: string) => setProfile((prev) => ({ ...prev, [field]: value }));
  const toggleList = (field: 'specialties' | 'assessments', value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((item) => item !== value) : [...prev[field], value],
    }));
  };

  return (
    <View style={styles.lightScreen}>
      <Header title="康复师资料" subtitle="用于负责任地进行患者匹配" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>专业身份</Text>
          <FormField label="姓名" value={profile.fullName} onChangeText={(value) => setField('fullName', value)} placeholder="请输入姓名" />
          <FormField label="专业头衔" value={profile.title} onChangeText={(value) => setField('title', value)} placeholder="神经康复治疗师" />
          <Text style={styles.formLabel}>职业</Text>
          <OptionChips options={therapistOptionSets.profession} value={profile.profession} onChange={(value) => setField('profession', value)} />
          <FormField label="城市或时区" value={profile.location} onChangeText={(value) => setField('location', value)} placeholder="伦敦 / GMT" />
          <FormField label="语言" value={profile.languages} onChangeText={(value) => setField('languages', value)} placeholder="中文、英文" />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>临床经验</Text>
          <Text style={styles.formLabel}>康复工作年限</Text>
          <OptionChips options={therapistOptionSets.yearsExperience} value={profile.yearsExperience} onChange={(value) => setField('yearsExperience', value)} />
          <Text style={styles.formLabel}>卒中康复经验</Text>
          <OptionChips options={therapistOptionSets.strokeExperience} value={profile.strokeExperience} onChange={(value) => setField('strokeExperience', value)} />
          <Text style={styles.formLabel}>专长</Text>
          <ToggleChips
            options={['上肢康复', '手功能', '步态', '平衡', '居家训练方案', '远程康复']}
            values={profile.specialties}
            onToggle={(value) => toggleList('specialties', value)}
          />
          <Text style={styles.formLabel}>常用评估</Text>
          <ToggleChips
            options={['Fugl-Meyer 上肢评估', 'ARAT', 'WMFT', '盒块测试', '九孔插板测试', '改良Ashworth量表']}
            values={profile.assessments}
            onToggle={(value) => toggleList('assessments', value)}
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>服务偏好</Text>
          <Text style={styles.formLabel}>支持方式</Text>
          <OptionChips options={therapistOptionSets.supportMode} value={profile.supportMode} onChange={(value) => setField('supportMode', value)} />
          <FormField label="可服务时间" value={profile.availability} onChangeText={(value) => setField('availability', value)} placeholder="工作日、晚上、周末..." />
          <View style={styles.consentNotice}>
            <Ionicons name="ribbon" size={20} color="#1267e6" />
            <Text style={styles.consentText}>正式匹配真实患者前，需要完成资质、身份、执业范围和临床治理审核。</Text>
          </View>
        </View>

        <PrimaryLightButton label="创建康复师资料" icon="checkmark-circle" onPress={() => onComplete(profile)} />
      </ScrollView>
    </View>
  );
}

function TherapistDashboardScreen({ profile, onBack }: { profile: TherapistProfile; onBack: () => void }) {
  return (
    <View style={styles.lightScreen}>
      <Header title="康复师工作台" subtitle="原型匹配资料已准备好" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.therapistHeroCard}>
          <View style={styles.therapistAvatar}>
            <Text style={styles.therapistAvatarText}>{profile.fullName.slice(0, 1) || 'T'}</Text>
          </View>
          <View style={styles.therapistHeroCopy}>
            <Text style={styles.therapistName}>{profile.fullName}</Text>
            <Text style={styles.therapistTitle}>{profile.title}</Text>
            <Text style={styles.therapistMeta}>{profile.location} - {profile.supportMode}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>匹配资料</Text>
          <InfoRow label="职业" value={profile.profession} />
          <InfoRow label="卒中经验" value={profile.strokeExperience} />
          <InfoRow label="语言" value={profile.languages} />
          <InfoRow label="可服务时间" value={profile.availability} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>临床重点</Text>
          <View style={styles.tagWrap}>
            {profile.specialties.map((item) => (
              <Text key={item} style={styles.profileTag}>{item}</Text>
            ))}
          </View>
          <Text style={styles.formSectionTitle}>评估工具</Text>
          <View style={styles.tagWrap}>
            {profile.assessments.map((item) => (
              <Text key={item} style={styles.profileTagMuted}>{item}</Text>
            ))}
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="time" size={22} color="#1267e6" />
          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>资质审核待完成</Text>
            <Text style={styles.tipText}>正式转诊真实患者前，应完成执照、身份、执业范围和临床治理审核。</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function HomeScreen({
  patientProfile,
  analysisResult,
  onOpenStrokeEducation,
  onOpenPeerSupport,
  onOpenFeedback,
}: {
  patientProfile: PatientProfile;
  analysisResult: UpperLimbAnalysisResult | null;
  onOpenStrokeEducation: () => void;
  onOpenPeerSupport: () => void;
  onOpenFeedback: () => void;
}) {
  const topProblem = analysisResult?.functionalProblems[0]
    ? translateProblemTitle(analysisResult.functionalProblems[0].id, analysisResult.functionalProblems[0].title)
    : '暂未生成功能问题';
  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Ionicons name="pulse" size={23} color="#071b33" />
          </View>
          <View>
            <Text style={styles.brandTitle}>AxonAI康复助手</Text>
            <Text style={styles.brandSubtitle}>卒中评估与训练方案</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>欢迎回来，{patientProfile.fullName || '患者'}</Text>
        <Text style={styles.heroBody}>
          {analysisResult
            ? `当前训练重点：${topProblem}。`
            : '了解更安全的居家卒中康复方法，并在下方进入功能评估模块。'}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>学习与支持</Text>
      <View style={styles.educationList}>
        <Pressable style={tapStyle(styles.educationCard)} onPress={onOpenStrokeEducation}>
          <Ionicons name="book" size={23} color="#1267e6" />
          <View style={styles.educationCopy}>
            <Text style={styles.educationTitle}>卒中康复基础</Text>
            <Text style={styles.educationText}>了解安全重复、疲劳、疼痛警示，以及为什么每日练习很重要。</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7f91a7" />
        </Pressable>
        <Pressable style={tapStyle(styles.educationCard)} onPress={onOpenPeerSupport}>
          <Ionicons name="chatbubbles" size={23} color="#0b756d" />
          <View style={styles.educationCopy}>
            <Text style={styles.educationTitle}>家属与同伴支持</Text>
            <Text style={styles.educationText}>我们计划建立有管理的卒中社区，让家属分享日常经验，同时避免不安全建议。</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7f91a7" />
        </Pressable>
        <Pressable style={tapStyle(styles.educationCard)} onPress={onOpenFeedback}>
          <Ionicons name="create" size={23} color="#8b5cf6" />
          <View style={styles.educationCopy}>
            <Text style={styles.educationTitle}>提交反馈</Text>
            <Text style={styles.educationText}>告诉我们哪里不清楚、哪里需要改进，或你的家庭还需要什么支持。</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7f91a7" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const strokeBasicsLessons = [
  {
    title: '每天少量练习也很重要',
    body: '短时、重复且安全的练习有助于大脑重新学习动作。疲劳让动作变乱前就应停止。',
    icon: 'repeat' as keyof typeof Ionicons.glyphMap,
  },
  {
    title: '动作质量比用力更重要',
    body: '动作要慢，保持躯干稳定，避免耸肩，并控制放下过程。',
    icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
  },
  {
    title: '注意警示信号',
    body: '如果训练出现尖锐疼痛、头晕、明显气短或突然加重，请暂停并咨询专业人员。',
    icon: 'warning' as keyof typeof Ionicons.glyphMap,
  },
  {
    title: '安全使用患侧上肢',
    body: '在舒适范围内练习有意义的任务，例如够物、张手、触碰目标或拿轻物。',
    icon: 'hand-left' as keyof typeof Ionicons.glyphMap,
  },
];

const peerSupportLessons = [
  {
    title: '建立简单居家训练习惯',
    body: '家属可准备稳定椅子、良好光线、整洁桌面和安静训练时间。',
    icon: 'home' as keyof typeof Ionicons.glyphMap,
  },
  {
    title: '鼓励患者，不要催促',
    body: '先给患者自己尝试的时间，再提供必要协助，效果更好。',
    icon: 'heart-circle' as keyof typeof Ionicons.glyphMap,
  },
  {
    title: '谨慎分享进展',
    body: '同伴经验可以带来鼓励，但每位卒中患者恢复不同。请把社区建议作为支持，而不是医疗指令。',
    icon: 'people' as keyof typeof Ionicons.glyphMap,
  },
  {
    title: '知道何时寻求专业帮助',
    body: '如果动作变得疼痛、不安全或明显比平时困难，请先联系康复师或医生再继续。',
    icon: 'medical' as keyof typeof Ionicons.glyphMap,
  },
];

function EducationDetailScreen({ kind, onBack }: { kind: 'basics' | 'support'; onBack: () => void }) {
  const isBasics = kind === 'basics';
  const lessons = isBasics ? strokeBasicsLessons : peerSupportLessons;
  return (
    <View style={styles.lightScreen}>
      <Header
        title={isBasics ? '卒中康复基础' : '家属与同伴支持'}
        subtitle={isBasics ? '更安全日常练习的简单原则' : '居家支持要避免不安全建议'}
        onBack={onBack}
        darkText
      />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.educationHeroCard}>
          <View style={[styles.educationHeroIcon, !isBasics && styles.educationHeroIconSupport]}>
            <Ionicons name={isBasics ? 'book' : 'chatbubbles'} size={30} color="#ffffff" />
          </View>
          <Text style={styles.educationHeroTitle}>{isBasics ? '康复来自可重复、可安全完成的练习。' : '好的支持应保护患者的主动性和独立性。'}</Text>
          <Text style={styles.educationHeroText}>
            {isBasics
              ? '训练前先看这些要点，让每个动作更可控、更有意义。'
              : '这些内容帮助家属和同伴支持康复，但不能替代专业医疗建议。'}
          </Text>
        </View>
        {lessons.map((lesson) => (
          <View key={lesson.title} style={styles.lessonCard}>
            <View style={styles.lessonIcon}>
              <Ionicons name={lesson.icon} size={22} color="#1267e6" />
            </View>
            <View style={styles.lessonCopy}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonBody}>{lesson.body}</Text>
            </View>
          </View>
        ))}
        <View style={styles.educationSafetyNote}>
          <Ionicons name="information-circle" size={20} color="#0b756d" />
          <Text style={styles.educationSafetyText}>本应用用于辅助康复计划制定，不能替代康复师、医生或紧急医疗服务。</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FeedbackScreen({
  patientUserId,
  analysisResult,
  onBack,
}: {
  patientUserId: string | null;
  analysisResult: UpperLimbAnalysisResult | null;
  onBack: () => void;
}) {
  const [authorRole, setAuthorRole] = useState('患者');
  const [category, setCategory] = useState('改进建议');
  const [message, setMessage] = useState('');
  const [contactPermission, setContactPermission] = useState(false);
  const [busy, setBusy] = useState(false);

  const submitFeedback = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 8) {
      Alert.alert('请补充一点细节', '请至少写一句话，方便团队理解你的建议。');
      return;
    }
    setBusy(true);
    try {
      await saveFeedbackSuggestion(
        patientUserId,
        authorRole.toLowerCase().replace(/\s+/g, '_'),
        category.toLowerCase().replace(/\s+/g, '_'),
        trimmed,
        contactPermission,
        {
          sourceScreen: 'home_feedback',
          appLanguage: 'en',
          algorithmVersion: analysisResult?.algorithmVersion ?? null,
          submittedAtClient: new Date().toISOString(),
        },
      );
      setMessage('');
      setContactPermission(false);
      Alert.alert('反馈已发送', '谢谢，你的建议已保存给 AxonAI 团队。');
      onBack();
    } catch (error) {
      showFriendlyError(
        '反馈未发送',
        '暂时无法发送反馈。请检查网络后重试。',
        '反馈提交失败',
        error,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.lightScreen}>
      <Header title="提交反馈" subtitle="帮助 AxonAI 更好服务患者和家庭" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.feedbackHeroCard}>
          <View style={styles.feedbackHeroIcon}>
            <Ionicons name="create" size={30} color="#ffffff" />
          </View>
          <Text style={styles.feedbackHeroTitle}>我们应该改进什么？</Text>
          <Text style={styles.feedbackHeroText}>患者和家属可以反馈不清楚的步骤、缺失的支持、问题或未来版本建议。</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>反馈人身份</Text>
          <OptionChips options={['患者', '家属', '照护者']} value={authorRole} onChange={setAuthorRole} />

          <Text style={styles.formLabel}>反馈类型</Text>
          <OptionChips options={['改进建议', '步骤不清楚', '问题反馈', '内容建议', '支持方式']} value={category} onChange={setCategory} />

          <Text style={styles.formLabel}>具体建议</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="告诉我们哪里不清楚、哪里不好用，或什么能帮助你在家康复..."
            placeholderTextColor="#8a9bb0"
            multiline
            textAlignVertical="top"
            style={styles.feedbackInput}
            maxLength={2000}
          />
          <Text style={styles.feedbackCounter}>{message.length}/2000</Text>

          <Pressable style={tapStyle(styles.feedbackConsentRow)} onPress={() => setContactPermission((value) => !value)}>
            <Ionicons name={contactPermission ? 'checkbox' : 'square-outline'} size={23} color={contactPermission ? '#1267e6' : '#6b7c91'} />
            <Text style={styles.feedbackConsentText}>如有需要，AxonAI 团队可以就此反馈联系我。</Text>
          </Pressable>

          <PrimaryLightButton label="发送反馈" icon="send" onPress={submitFeedback} disabled={busy} loading={busy} />
        </View>
      </ScrollView>
    </View>
  );
}

function AssessmentScreen({ onOpenPackage }: { onOpenPackage: (pkg: RehabPackage) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCompact}>
        <Text style={styles.heroKicker}>评估</Text>
        <Text style={styles.heroTitleCompact}>选择功能评估包</Text>
        <Text style={styles.heroBody}>先按指导采集视频。AxonAI 会先检查视频质量，再进行分析和训练计划生成。</Text>
      </View>
      <Text style={styles.sectionLabel}>选择功能评估包</Text>
      <View style={styles.packageGrid}>
        {packages.map((pkg) => (
          <Pressable
            key={pkg.key}
            style={({ pressed }) => [styles.packageCard, !pkg.active && styles.disabledCard, pressed && styles.tapFeedback]}
            onPress={() => onOpenPackage(pkg)}
          >
            <View style={[styles.packageIcon, pkg.active && styles.packageIconActive]}>
              <Ionicons name={pkg.icon} size={22} color={pkg.active ? '#ffffff' : '#5d6f84'} />
            </View>
            <View style={styles.packageCopy}>
              <Text style={styles.packageTitle}>{pkg.title}</Text>
            </View>
            <Text style={[styles.packageStatus, pkg.active && styles.packageStatusActive]}>{pkg.active ? '开始' : '即将开放'}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function PatientTrainingScreen({
  hasPlan,
  onStartAssessment,
  onOpenPlan,
}: {
  hasPlan: boolean;
  onStartAssessment: () => void;
  onOpenPlan: () => void;
}) {
  return (
    <View style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabHeroCard}>
          <View style={styles.tabHeroIcon}>
            <Ionicons name="fitness" size={30} color="#ffffff" />
          </View>
          <Text style={styles.tabHeroTitle}>训练</Text>
          <Text style={styles.tabHeroText}>
            {hasPlan
              ? '你的每周训练计划已准备好。打开后可查看今日训练和动作示范。'
              : '完成动作采集和分析后，这里会显示与你功能问题匹配的训练计划。'}
          </Text>
          <PrimaryLightButton label={hasPlan ? '打开每周计划' : '先开始评估'} icon={hasPlan ? 'calendar' : 'videocam'} onPress={hasPlan ? onOpenPlan : onStartAssessment} />
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>这里会显示</Text>
          <InfoRow label="每日训练" value="剂量、组数、次数" />
          <InfoRow label="动作示范" value="视频指导" />
          <InfoRow label="训练反馈" value="疼痛、疲劳、完成情况" />
        </View>
      </ScrollView>
    </View>
  );
}

function PatientCareScreen({
  person,
  matchId,
  onStartMatch,
  onOpenProfile,
}: {
  person: MatchedPerson;
  matchId: string | null;
  onStartMatch: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <View style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabHeroCard}>
          <View style={[styles.tabHeroIcon, styles.tabHeroIconTeal]}>
            <Ionicons name="people" size={30} color="#071b33" />
          </View>
          <Text style={styles.tabHeroTitle}>照护团队</Text>
          <Text style={styles.tabHeroText}>
            {matchId ? '你的康复师请求已发送。等待回应时可以查看匹配资料。' : '生成训练计划后，为你匹配康复师和居家支持网络。'}
          </Text>
          <PrimaryLightButton label={matchId ? '查看匹配康复师' : '匹配 AXONAI 康复师'} icon={matchId ? 'person-circle' : 'search'} onPress={matchId ? onOpenProfile : onStartMatch} />
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>推荐匹配</Text>
          <InfoRow label="康复师" value={person.name} />
          <InfoRow label="专长" value={person.tags[0]} />
          <InfoRow label="匹配度" value={person.matchScore} />
        </View>
      </ScrollView>
    </View>
  );
}

function PatientMeScreen({
  profile,
  account,
  onEditProfile,
  onLogout,
}: {
  profile: PatientProfile;
  account: AccountSession | null;
  onEditProfile: () => void;
  onLogout: () => void;
}) {
  return (
    <View style={styles.lightScreen}>
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.patientProfileCard}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{(profile.fullName || 'P').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.patientProfileCopy}>
            <Text style={styles.therapistName}>{profile.fullName || '患者'}</Text>
            <Text style={styles.therapistTitle}>{account?.identifier ?? '暂无账号信息'}</Text>
            <Text style={styles.therapistMeta}>{profile.location} - {profile.supportMode}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>康复资料</Text>
          <InfoRow label="受影响侧" value={profile.affectedSide} />
          <InfoRow label="发病时间" value={profile.onsetTime} />
          <InfoRow label="主要目标" value={profile.mainGoal} />
          <InfoRow label="安全提醒" value={profile.safetyFlags.length ? profile.safetyFlags.join(', ') : '暂无记录'} />
        </View>

        <PrimaryLightButton label="编辑患者资料" icon="create" onPress={onEditProfile} />
        <Pressable style={tapStyle(styles.logoutButton)} onPress={onLogout}>
          <Ionicons name="log-out" size={18} color="#c62828" />
          <Text style={styles.logoutButtonText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function CollectScreen({
  currentAction,
  currentActionIndex,
  completedCount,
  recordedVideos,
  qualityPassed,
  qualityResults,
  qualityCheckingActionId,
  qualityCheckingActions,
  frameCheckResults,
  frameCheckingActionId,
  isCameraOpen,
  isRecording,
  cameraRef,
  canGeneratePlan,
  onBack,
  onOpenCamera,
  onStartRecording,
  onStopRecording,
  onRetryAction,
  onRecheckPosition,
  onSelectAction,
  onGeneratePlan,
  onOpenGuide,
}: {
  currentAction: CollectionAction;
  currentActionIndex: number;
  completedCount: number;
  recordedVideos: Record<string, string>;
  qualityPassed: Record<string, boolean>;
  qualityResults: Record<string, VideoQualityResult>;
  qualityCheckingActionId: string | null;
  qualityCheckingActions: Record<string, boolean>;
  frameCheckResults: Record<string, FrameCheckResult>;
  frameCheckingActionId: string | null;
  isCameraOpen: boolean;
  isRecording: boolean;
  cameraRef: React.MutableRefObject<CameraView | null>;
  canGeneratePlan: boolean;
  onBack: () => void;
  onOpenCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetryAction: () => void;
  onRecheckPosition: () => void;
  onSelectAction: (index: number) => void;
  onGeneratePlan: () => void;
  onOpenGuide: (action: CollectionAction) => void;
}) {
  const currentQuality = qualityResults[currentAction.id];
  const isCheckingQuality = Boolean(qualityCheckingActions[currentAction.id] || qualityCheckingActionId === currentAction.id);
  const qualityPassedCurrent = qualityPassed[currentAction.id];
  const currentFrameCheck = frameCheckResults[currentAction.id];
  const isCheckingFrame = frameCheckingActionId === currentAction.id;
  const frameReadyCurrent = currentFrameCheck?.passed;
  const showCameraOverlay = Boolean(isCheckingFrame || isRecording || frameReadyCurrent || (currentFrameCheck && !currentFrameCheck.passed) || isCheckingQuality || qualityPassedCurrent || currentQuality);
  const overlayPassed = Boolean(qualityPassedCurrent || (frameReadyCurrent && !isCheckingQuality && !currentQuality));
  const overlayFailed = Boolean((currentFrameCheck && !currentFrameCheck.passed) || (currentQuality && !qualityPassedCurrent && !isCheckingQuality));
  const overlayText = isCheckingFrame
    ? '正在检查位置...'
    : isRecording
      ? '录制中...'
      : isCheckingQuality
        ? '正在检查视频质量...'
        : qualityPassedCurrent
          ? '视频已通过'
          : frameReadyCurrent
            ? '可以开始'
            : currentFrameCheck && !currentFrameCheck.passed
              ? '请调整位置'
              : '请重录';
  const overlayHint = currentFrameCheck && !currentFrameCheck.passed
    ? translateVideoTip(currentFrameCheck.tips[0])
    : currentQuality && !qualityPassedCurrent
      ? translateVideoTip(currentQuality.tips[0] ?? currentQuality.patientMessage)
      : undefined;

  return (
    <View style={styles.screen}>
      <Header title="上肢功能采集" subtitle={`${completedCount}/${activeUpperActions.length} 个动作已通过质量检查`} onBack={onBack} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.progressPanel}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedCount / activeUpperActions.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>测试模式：完成前3个动作并通过质量检查后，可生成我的康复方案。</Text>
        </View>

        <View style={styles.actionStepper}>
          {activeUpperActions.map((action, index) => {
            const selected = index === currentActionIndex;
            const done = qualityPassed[action.id];
            const checking = qualityCheckingActions[action.id];
            const failed = qualityResults[action.id] && !qualityResults[action.id].passed && !checking;
            return (
              <Pressable
                key={action.id}
                style={({ pressed }) => [styles.stepPill, selected && styles.stepPillActive, pressed && styles.tapFeedback]}
                onPress={() => onSelectAction(index)}
              >
                <Text style={[styles.stepNumber, done && styles.stepDone, failed && styles.stepFailed]}>{done ? '✓' : checking ? '...' : failed ? '!' : index + 1}</Text>
                <Text style={[styles.stepTitle, selected && styles.stepTitleActive]} numberOfLines={1}>
                  {action.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.currentActionCard}>
          <Text style={styles.actionKicker}>Movement {currentActionIndex + 1} / {activeUpperActions.length}</Text>
          <Text style={styles.currentActionTitle}>{currentAction.title}</Text>
          <Text style={styles.currentActionTarget}>{currentAction.target}</Text>
          <View style={styles.instructionBox}>
            <Ionicons name="mic" size={17} color="#01d4c0" />
            <Text style={styles.instructionText}>{currentAction.instruction}</Text>
          </View>
          <Pressable style={tapStyle(styles.collectionGuideButton)} onPress={() => onOpenGuide(currentAction)}>
            <Ionicons name={currentAction.demoVideoUrl ? 'play-circle' : 'information-circle'} size={20} color="#ffffff" />
            <View style={styles.collectionGuideCopy}>
              <Text style={styles.collectionGuideTitle}>{currentAction.demoVideoUrl ? '观看录制指导' : '查看录制指导'}</Text>
              <Text style={styles.collectionGuideSource}>{currentAction.cameraView}: {currentAction.viewInstruction}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color="#dff8ff" />
          </Pressable>
        </View>

        <View style={styles.cameraFrame}>
          {isCameraOpen ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front" mode="video" />
          ) : (
            <View style={styles.cameraEmpty}>
              <Ionicons name="videocam" size={48} color="#8197b4" />
              <Text style={styles.cameraEmptyTitle}>打开摄像头开始</Text>
              <Text style={styles.cameraEmptyText}>请确保上半身和患侧手臂完整入镜，并保持光线充足。</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="scan" size={14} color="#ffffff" />
            <Text style={styles.cameraBadgeText}>{currentAction.cameraView}，距离约1.5米</Text>
          </View>
          {showCameraOverlay && (
            <View style={[styles.cameraQualityOverlay, overlayPassed && styles.cameraQualityOverlayPass, overlayFailed && styles.cameraQualityOverlayFail]}>
              {isCheckingFrame || isCheckingQuality ? <ActivityIndicator color="#ffffff" /> : <Ionicons name={overlayPassed ? 'checkmark-circle' : overlayFailed ? 'alert-circle' : 'radio-button-on'} size={38} color="#ffffff" />}
              <Text style={styles.cameraQualityOverlayText}>{overlayText}</Text>
              {overlayHint && !isCheckingFrame && !isCheckingQuality && (
                <Text style={styles.cameraQualityOverlayHint}>{overlayHint}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.controls}>
          {!isCameraOpen && <PrimaryButton label="打开摄像头" icon="camera" onPress={onOpenCamera} />}
          {isCameraOpen && !isRecording && !isCheckingQuality && !isCheckingFrame && <PrimaryButton label="开始录制" icon="radio-button-on" onPress={onStartRecording} />}
          {isRecording && <DangerButton label="停止并保存" icon="stop-circle" onPress={onStopRecording} />}
          {currentFrameCheck && !currentFrameCheck.passed && !isCheckingFrame && <SecondaryButton label="重新检查位置" icon="scan" onPress={onRecheckPosition} />}
          <SecondaryButton label="重录" icon="refresh" onPress={onRetryAction} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.generateButton, !canGeneratePlan && styles.generateButtonDisabled, pressed && styles.tapFeedbackStrong]}
          onPress={onGeneratePlan}
        >
          <Text style={styles.generateButtonText}>生成我的康复方案</Text>
          <Ionicons name="arrow-forward" size={20} color="#031629" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function CollectionGuideScreen({
  action,
  isPlaying,
  onBack,
  onTogglePlay,
}: {
  action: CollectionAction;
  isPlaying: boolean;
  onBack: () => void;
  onTogglePlay: () => void;
}) {
  return (
    <View style={styles.demoScreen}>
      <Header title="录制指导" subtitle={action.title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.demoContent} showsVerticalScrollIndicator={false}>
        <View style={styles.videoPanel}>
          {action.demoVideoUrl ? (
            <Video
              source={{ uri: action.demoVideoUrl }}
              style={styles.demoVideo}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={isPlaying}
              isMuted={false}
              volume={1}
            />
          ) : (
            <LinearGradient colors={['#eaf7ff', '#dff7f3']} style={styles.demoImage}>
              <View style={styles.therapistFigure}>
                <Ionicons name={action.cameraView === '正面视角' ? 'body' : 'walk'} size={92} color="#164b85" />
                <Ionicons name="videocam" size={42} color="#0f6eff" style={styles.handIcon} />
              </View>
              <Text style={styles.demoPlaceholderText}>接入审核后的 HeyGen 资源后，这里会显示康复师动作示范视频。</Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.demoInfo}>
          <View style={styles.collectionViewBadge}>
            <Ionicons name="camera" size={18} color="#0f6eff" />
            <Text style={styles.collectionViewBadgeText}>{action.cameraView}</Text>
          </View>
          <Text style={styles.demoSectionTitle}>如何录制</Text>
          <View style={styles.demoRow}>
            <Ionicons name="checkmark-circle" size={19} color="#0f6eff" />
            <Text style={styles.demoRowText}>{action.viewInstruction}</Text>
          </View>
          <View style={styles.demoRow}>
            <Ionicons name="checkmark-circle" size={19} color="#0f6eff" />
            <Text style={styles.demoRowText}>{action.guideScript}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.warningTitle}>录制前注意</Text>
          {['请确保患侧手臂、肩、肘、腕和躯干可见。', '请使用明亮光线，并保持手机稳定。', '如出现疼痛、头晕或异常不适，请停止。'].map((item) => (
            <View key={item} style={styles.demoRow}>
              <Ionicons name="warning" size={18} color="#ffb000" />
              <Text style={styles.demoRowText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function AnalysisLoadingScreen({
  isComplete,
  onBack,
  onComplete,
  title = '生成我的康复方案',
  subtitle = '正在分析动作表现和训练重点',
  headline = '智能分析中',
  lead = '正在整理动作质量、功能问题和训练重点，为你生成更清晰的康复方案。',
  statuses = ['分析动作表现', '整理功能问题', '匹配训练重点'],
}: {
  isComplete: boolean;
  onBack: () => void;
  onComplete: () => void;
  title?: string;
  subtitle?: string;
  headline?: string;
  lead?: string;
  statuses?: string[];
}) {
  const scan = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const dataFlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scan, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    const sweepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    const dataLoop = Animated.loop(
      Animated.timing(dataFlow, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    scanLoop.start();
    pulseLoop.start();
    sweepLoop.start();
    dataLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
      sweepLoop.stop();
      dataLoop.stop();
    };
  }, [dataFlow, pulse, scan, sweep]);

  useEffect(() => {
    if (!isComplete) {
      return undefined;
    }
    const done = setTimeout(onComplete, 700);
    return () => clearTimeout(done);
  }, [isComplete, onComplete]);

  const scanRotate = scan.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const nodeScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.16] });
  const nodeOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.48, 1] });
  const sweepTranslate = sweep.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] });
  const dataTranslate = dataFlow.interpolate({ inputRange: [0, 1], outputRange: [-95, 115] });
  const dataTranslateReverse = dataFlow.interpolate({ inputRange: [0, 1], outputRange: [115, -95] });

  return (
    <View style={styles.analysisScreen}>
      <Header title={title} subtitle={subtitle} onBack={onBack} />
      <View style={styles.analysisContent}>
        <View style={styles.techCard}>
          <View style={styles.techGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={`h-${index}`} style={[styles.techGridLineHorizontal, { top: 38 + index * 34 }]} />
            ))}
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={`v-${index}`} style={[styles.techGridLineVertical, { left: 38 + index * 54 }]} />
            ))}
          </View>
          <Animated.View style={[styles.techScanLine, { transform: [{ translateY: sweepTranslate }] }]} />
          <Animated.View style={[styles.dataChip, styles.dataChipTop, { transform: [{ translateX: dataTranslate }] }]}>
            <Text style={styles.dataChipText}>ROM</Text>
          </Animated.View>
          <Animated.View style={[styles.dataChip, styles.dataChipBottom, { transform: [{ translateX: dataTranslateReverse }] }]}>
            <Text style={styles.dataChipText}>PLAN</Text>
          </Animated.View>
          <Animated.View style={[styles.techOrbitOuter, { transform: [{ rotate: scanRotate }] }]} />
          <Animated.View style={[styles.techOrbitInner, { transform: [{ rotate: scanRotate }] }]} />
          <View style={styles.techCore}>
            <Ionicons name="analytics" size={46} color="#05e1d2" />
            <Text style={styles.techCoreText}>AXONAI</Text>
          </View>
          {[styles.techNodeTop, styles.techNodeRight, styles.techNodeBottom, styles.techNodeLeft].map((style, index) => (
            <Animated.View
              key={index}
              style={[
                styles.techNode,
                style,
                {
                  opacity: nodeOpacity,
                  transform: [{ scale: nodeScale }],
                },
              ]}
            />
          ))}
          <View style={styles.techBarOne} />
          <View style={styles.techBarTwo} />
          <View style={styles.techBarThree} />
        </View>

        <Text style={styles.analysisTitle}>{headline}</Text>
        <Text style={styles.analysisText}>{lead}</Text>
        <View style={styles.analysisProgressTrack}>
          <Animated.View style={[styles.analysisProgressGlow, { transform: [{ translateX: dataTranslate }] }]} />
        </View>

        <View style={styles.analysisStatusCard}>
          {statuses.map((status, index) => (
            <View key={status} style={styles.analysisStatusRow}>
              <Ionicons name={index === 0 ? 'scan' : index === 1 ? 'analytics' : 'fitness'} size={18} color="#05e1d2" />
              <Text style={styles.analysisStatusText}>{status}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function WeeklyPlanLoadingScreen({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    pulseLoop.start();
    shimmerLoop.start();
    Animated.timing(progress, {
      toValue: 1,
      duration: 3300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const done = setTimeout(onComplete, 3500);

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
      clearTimeout(done);
    };
  }, [onComplete, progress, pulse, shimmer]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['8%', '100%'],
  });
  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 260],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <View style={styles.analysisScreen}>
      <Header title="生成每周训练计划" subtitle="准备每日康复任务" onBack={onBack} />
      <View style={styles.weeklyLoadingContent}>
        <Animated.View style={[styles.weeklyLoadingIcon, { transform: [{ scale: pulseScale }] }]}>
          <Ionicons name="calendar-clear" size={42} color="#05e1d2" />
          <View style={styles.weeklyLoadingDot} />
        </Animated.View>

        <Text style={styles.weeklyLoadingTitle}>正在生成每周计划</Text>
        <Text style={styles.weeklyLoadingText}>正在为本周训练选择合适动作、每日剂量和示范顺序。</Text>

        <View style={styles.weeklyProgressTrack}>
          <Animated.View style={[styles.weeklyProgressFill, { width: progressWidth }]}>
            <Animated.View style={[styles.weeklyProgressShimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
          </Animated.View>
        </View>

        <View style={styles.weeklyStepCard}>
          {['将功能问题匹配到训练动作', '设置每日训练剂量', '加载动作示范'].map((step, index) => (
            <View key={step} style={styles.weeklyStepRow}>
              <View style={styles.weeklyStepIcon}>
                <Text style={styles.weeklyStepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.weeklyStepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function MetricsScreen({
  analysisResult,
  onBack,
  onContinue,
}: {
  analysisResult: UpperLimbAnalysisResult | null;
  onBack: () => void;
  onContinue: () => void;
}) {
  const metrics = buildPatientMetrics(analysisResult);
  return (
    <View style={styles.lightScreen}>
      <Header title="动作指标" subtitle="用简单图示了解你的上肢表现" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsHero}>
          <Text style={styles.metricsHeroTitle}>我们从视频中看到的情况</Text>
          <Text style={styles.metricsHeroText}>这些是基于手机视频的初步筛查估计，用来帮助你在查看完整方案前理解动作重点。</Text>
        </View>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIcon, { backgroundColor: metric.color }]}>
                <Ionicons name={metric.icon} size={22} color="#ffffff" />
              </View>
              <View style={styles.metricCopy}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            </View>
            <View style={styles.metricTrack}>
              <View style={[styles.metricFill, { width: `${metric.percent}%`, backgroundColor: metric.color }]} />
            </View>
            <Text style={styles.metricHint}>{metric.hint}</Text>
          </View>
        ))}
        <PrimaryLightButton label="查看我的功能问题" icon="analytics" onPress={onContinue} />
      </ScrollView>
    </View>
  );
}

function buildPatientMetrics(analysisResult: UpperLimbAnalysisResult | null) {
  const metricByAction = new Map<string, Record<string, any>>();
  (analysisResult?.actionAnalyses ?? []).forEach((action) => {
    metricByAction.set(action.action_id, action.metrics ?? {});
  });
  const shoulderFlexion = Number(metricByAction.get('shoulder_flexion')?.shoulderFlexionRomDeg ?? 48);
  const reach = Number(metricByAction.get('forward_reach')?.reachCompletionRatio ?? 0.52);
  const wrist = Number(metricByAction.get('wrist_extension')?.wristExtensionRomDeg ?? 18);
  const smoothnessValues = Array.from(metricByAction.values())
    .map((item) => Number(item.smoothnessScore))
    .filter((value) => Number.isFinite(value));
  const smoothness = smoothnessValues.length ? smoothnessValues.reduce((sum, value) => sum + value, 0) / smoothnessValues.length : 0.58;
  return [
    {
      label: '手臂抬高范围',
      value: `${Math.round(shoulderFlexion)}°`,
      percent: Math.max(8, Math.min(100, Math.round((shoulderFlexion / 120) * 100))),
      hint: '显示上肢动作中手臂能抬到多高。',
      color: '#1267e6',
      icon: 'arrow-up-circle' as keyof typeof Ionicons.glyphMap,
    },
    {
      label: '前伸够物能力',
      value: `${Math.round(Math.min(reach, 1) * 100)}%`,
      percent: Math.max(8, Math.min(100, Math.round(Math.min(reach, 1) * 100))),
      hint: '显示手能否向前接近目标。',
      color: '#0b756d',
      icon: 'navigate-circle' as keyof typeof Ionicons.glyphMap,
    },
    {
      label: '腕背伸控制',
      value: `${Math.round(wrist)}°`,
      percent: Math.max(8, Math.min(100, Math.round((wrist / 60) * 100))),
      hint: '这与张手、抓握和释放物体有关。',
      color: '#ff9f0a',
      icon: 'hand-left' as keyof typeof Ionicons.glyphMap,
    },
    {
      label: '动作平滑度',
      value: `${Math.round(smoothness * 100)}%`,
      percent: Math.max(8, Math.min(100, Math.round(smoothness * 100))),
      hint: '平滑度较低可能提示身体代偿或控制不稳定。',
      color: '#8b5cf6',
      icon: 'pulse' as keyof typeof Ionicons.glyphMap,
    },
  ];
}

function ProblemsScreen({
  analysisResult,
  onBack,
  onPlan,
  onDemo,
}: {
  analysisResult: UpperLimbAnalysisResult | null;
  onBack: () => void;
  onPlan: () => void;
  onDemo: (exercise: Exercise) => void;
}) {
  const displayProblems = analysisResult?.functionalProblems.length
    ? analysisResult.functionalProblems
    : demoProblems.map((problem, index) => ({
        id: ['limited_active_shoulder_elevation', 'trunk_or_scapular_compensation', 'wrist_hand_release_difficulty'][index],
        title: problem.title,
        severity: index === 0 ? 'moderate' : 'mild',
        patient_summary: problem.summary,
        daily_life_impact: [],
        evidence: [],
      }));
  return (
    <View style={styles.lightScreen}>
      <Header title="我的功能问题" subtitle="上肢功能包总结" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        {displayProblems.map((problem, index) => (
          <View key={problem.title} style={styles.problemCard}>
            <View style={styles.problemIndex}>
              <Text style={styles.problemIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.problemIllustration}>
              <Image source={imageForProblem(problem.id)} style={styles.problemImage} resizeMode="cover" />
            </View>
            <View style={styles.problemCopy}>
              <Text style={styles.problemArea}>{formatSeverity(problem.severity)}</Text>
              <Text style={styles.problemTitle}>{translateProblemTitle(problem.id, problem.title)}</Text>
              <Text style={styles.problemSummary}>{translateProblemSummary(problem.id, problem.patient_summary)}</Text>
            </View>
          </View>
        ))}

        <PrimaryLightButton label="查看每周训练计划" icon="calendar" onPress={onPlan} />
        <Pressable style={tapStyle(styles.inlineDemoButton)} onPress={() => onDemo(exercises[0])}>
          <Ionicons name="play-circle" size={20} color="#1267e6" />
          <Text style={styles.inlineDemoText}>预览动作示范</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function PlanScreen({
  analysisResult,
  selectedDay,
  allExercises,
  dayExercises,
  onSelectDay,
  onBack,
  onMatch,
  onDemo,
}: {
  analysisResult: UpperLimbAnalysisResult | null;
  selectedDay: number;
  allExercises: Exercise[];
  dayExercises: Exercise[];
  onSelectDay: (day: number) => void;
  onBack: () => void;
  onMatch: () => void;
  onDemo: (exercise: Exercise) => void;
}) {
  const selectedDayName = displayWeekDays[selectedDay - 1] ?? '今日';
  return (
    <View style={styles.lightScreen}>
      <Header title="个性化训练计划" subtitle="每天完成当天训练任务" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.weekPanel}>
          <View>
            <Text style={styles.weekTitle}>{selectedDay === 1 ? "今日计划" : `${selectedDayName}计划`}</Text>
            <Text style={styles.weekDate}>{selectedDay === 1 ? '向右滑动查看未来几天计划' : '向左滑回今日计划'}</Text>
          </View>
          <Text style={styles.weekCount}>{dayExercises.length} 项任务</Text>
        </View>
        <ScrollView
          horizontal
          pagingEnabled
          snapToInterval={316}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPager}
          onMomentumScrollEnd={(event) => {
            const nextDay = Math.min(7, Math.max(1, Math.round(event.nativeEvent.contentOffset.x / 316) + 1));
            onSelectDay(nextDay);
          }}
        >
          {weekDays.map((day, index) => {
            const value = index + 1;
            const selected = selectedDay === value;
            return (
              <Pressable key={day} style={({ pressed }) => [styles.dayPlanCard, selected && styles.dayPlanCardActive, pressed && styles.tapFeedback]} onPress={() => onSelectDay(value)}>
                <View>
                  <Text style={[styles.dayText, selected && styles.dayTextActive]}>{displayWeekDays[index]}</Text>
                  <Text style={[styles.dayPlanTitle, selected && styles.dayPlanTitleActive]}>{value === 1 ? "今日任务" : `第${value}天`}</Text>
                  <Text style={[styles.dayPlanHint, selected && styles.dayPlanHintActive]}>{allExercises.filter((exercise) => exercise.dayPattern.includes(value)).length} 个训练动作</Text>
                </View>
                <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={selected ? '#ffffff' : '#b4c0ce'} />
              </Pressable>
            );
          })}
        </ScrollView>

        {dayExercises.map((exercise) => (
          <Pressable key={exercise.id} style={tapStyle(styles.exerciseCard)} onPress={() => onDemo(exercise)}>
            <View style={styles.exerciseThumb}>
              <Image source={exercise.coverImage} style={styles.exerciseCoverImage} resizeMode="cover" />
            </View>
            <View style={styles.exerciseCopy}>
              <Text style={styles.exerciseTitle}>{exercise.title}</Text>
              <Text style={styles.exerciseImproves}>{exercise.improves}</Text>
              <Text style={styles.exerciseDose}>{exercise.dose}</Text>
            </View>
          </Pressable>
        ))}
        <MatchButton onPress={onMatch} />
      </ScrollView>
    </View>
  );
}

function MatchButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={tapStyle(styles.axonMatchButton)} onPress={onPress}>
      <View style={styles.axonMatchIcon}>
        <Ionicons name="people" size={23} color="#031629" />
      </View>
      <View style={styles.axonMatchCopy}>
        <Text style={styles.axonMatchTitle}>匹配 AXONAI 康复师</Text>
        <Text style={styles.axonMatchText}>同时搜索康复师和居家支持网络</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#031629" />
    </Pressable>
  );
}

function MatchScreen({ onBack, onMatched }: { onBack: () => void; onMatched: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    const interval = setInterval(() => setCandidateIndex((value) => (value + 1) % supportNames.length), 800);
    const done = setTimeout(onMatched, 4600);
    return () => {
      loop.stop();
      clearInterval(interval);
      clearTimeout(done);
    };
  }, [onMatched, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.45] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.85, 0.28, 0] });

  return (
    <View style={styles.matchScreen}>
      <Header title="匹配 AXONAI 康复师" subtitle="正在搜索康复师和支持网络" onBack={onBack} />
      <View style={styles.matchContent}>
        <View style={styles.networkCanvas}>
          <Animated.View style={[styles.networkRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
          <View style={styles.networkCore}>
            <Ionicons name="pulse" size={42} color="#05e1d2" />
            <Text style={styles.networkCoreText}>AxonAI</Text>
          </View>
          <NetworkNode label="康复师" top={30} left={24} delay={0} />
          <NetworkNode label="护工" top={78} right={18} delay={160} />
          <NetworkNode label="陪护" bottom={88} left={16} delay={320} />
          <NetworkNode label="技师" bottom={44} right={28} delay={480} />
        </View>
        <View style={styles.candidateCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{supportNames[candidateIndex].slice(0, 1)}</Text>
          </View>
          <View style={styles.candidateCopy}>
            <Text style={styles.matchingLabel}>匹配中</Text>
            <Text style={styles.candidateName}>{supportNames[candidateIndex]}</Text>
            <Text style={styles.candidateTitle}>正在根据训练目标评估匹配度</Text>
          </View>
        </View>
        <Text style={styles.matchHint}>结果页将展示匹配到的康复师资料，供患者确认。</Text>
      </View>
    </View>
  );
}

function NetworkNode({ label, top, bottom, left, right, delay }: { label: string; top?: number; bottom?: number; left?: number; right?: number; delay: number }) {
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(appear, { toValue: 1, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(760),
        Animated.timing(appear, { toValue: 0, duration: 520, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [appear, delay]);

  return (
    <Animated.View style={[styles.networkNode, { top, bottom, left, right, opacity: appear }]}>
      <Ionicons name="person-circle" size={19} color="#05e1d2" />
      <Text style={styles.networkNodeText}>{label}</Text>
    </Animated.View>
  );
}

function ProfileScreen({ person, onBack, onConfirm }: { person: MatchedPerson; onBack: () => void; onConfirm: () => void }) {
  return (
    <View style={styles.lightScreen}>
      <Header title="AXONAI 康复师匹配成功" subtitle="已为你匹配到合适的康复师" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.therapistHeroCard}>
          <View style={styles.therapistHeaderRow}>
            <View style={styles.therapistAvatar}>
              <Text style={styles.therapistAvatarText}>{person.name.slice(0, 1)}</Text>
            </View>
            <View style={styles.therapistTitleWrap}>
              <Text style={styles.therapistName}>{person.name}</Text>
              <Text style={styles.therapistRole}>{person.title}</Text>
              <Text style={styles.therapistHospital}>{person.organization}</Text>
            </View>
            <View style={styles.matchScoreBadge}>
              <Text style={styles.matchScoreText}>{person.matchScore}</Text>
              <Text style={styles.matchScoreLabel}>匹配</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            {person.tags.map((tag) => (
              <View key={tag} style={styles.therapistTag}>
                <Text style={styles.therapistTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>康复师经验</Text>
          {person.experience.map((item) => (
            <View key={item} style={styles.profileRow}>
              <Ionicons name="checkmark-circle" size={18} color="#1267e6" />
              <Text style={styles.profileRowText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>重点方向</Text>
          {person.focus.map((item) => (
            <View key={item} style={styles.focusPill}>
              <Ionicons name="analytics" size={17} color="#0b756d" />
              <Text style={styles.focusPillText}>{item}</Text>
            </View>
          ))}
        </View>

        <Pressable style={tapStyle(styles.confirmTherapistButton)} onPress={onConfirm}>
          <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
          <Text style={styles.confirmTherapistText}>确认康复师</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function WaitingScreen({ person, matchId, onBack }: { person: MatchedPerson; matchId: string | null; onBack: () => void }) {
  return (
    <View style={styles.waitingScreen}>
      <Header title="等待康复师回应" subtitle="请求已发送。康复师确认后会联系你。" onBack={onBack} />
      <View style={styles.waitingContent}>
        <View style={styles.waitingIconWrap}>
          <Ionicons name="time" size={58} color="#05e1d2" />
        </View>
        <Text style={styles.waitingTitle}>正在等待 {person.name} 回应</Text>
        <Text style={styles.waitingText}>康复师将查看你的功能问题和训练计划。正式版本会包含通知、预约和康复师端确认流程。</Text>
        <View style={styles.waitingStatusCard}>
          <Ionicons name="send" size={20} color="#1267e6" />
          <Text style={styles.waitingStatusText}>{matchId ? `匹配请求已发送：${matchId.slice(0, 8)}` : '匹配请求已发送'}</Text>
        </View>
      </View>
    </View>
  );
}

const patientTabs: Array<{ key: PatientTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'home', label: '首页', icon: 'home' },
  { key: 'assessment', label: '评估', icon: 'body' },
  { key: 'training', label: '训练', icon: 'fitness' },
  { key: 'care', label: '照护团队', icon: 'people' },
  { key: 'me', label: '我的', icon: 'person' },
];

function PatientBottomTabs({ activeTab, onSelect }: { activeTab: PatientTab; onSelect: (tab: PatientTab) => void }) {
  return (
    <View style={styles.bottomTabBar}>
      {patientTabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable key={tab.key} style={({ pressed }) => [styles.bottomTabItem, active && styles.bottomTabItemActive, pressed && styles.tapFeedback]} onPress={() => onSelect(tab.key)}>
            <Ionicons name={tab.icon} size={21} color={active ? '#1267e6' : '#71839a'} />
            <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DemoScreen({ exercise, isPlaying, onBack, onTogglePlay }: { exercise: Exercise; isPlaying: boolean; onBack: () => void; onTogglePlay: () => void }) {
  return (
    <View style={styles.demoScreen}>
      <Header title="动作示范" subtitle={exercise.title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.demoContent} showsVerticalScrollIndicator={false}>
        <View style={styles.videoPanel}>
          {exercise.demoVideoUrl ? (
            <Video
              source={{ uri: exercise.demoVideoUrl }}
              style={styles.demoVideo}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={isPlaying}
              isMuted={false}
              volume={1}
            />
          ) : (
            <LinearGradient colors={['#eef8ff', exercise.imageTone]} style={styles.demoImage}>
              <View style={styles.therapistFigure}>
                <Ionicons name="person" size={92} color="#164b85" />
                <Ionicons name="hand-left" size={43} color="#0f6eff" style={styles.handIcon} />
              </View>
              <Pressable style={tapStyle(styles.playButton)} onPress={onTogglePlay}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color="#ffffff" />
              </Pressable>
              <Text style={styles.demoPlaceholderText}>接入审核后的 HeyGen 资源后，这里会显示康复师动作示范视频。</Text>
              <View style={styles.videoProgress}>
                <View style={[styles.videoProgressFill, { width: isPlaying ? '56%' : '18%' }]} />
              </View>
            </LinearGradient>
          )}
        </View>
        <View style={styles.demoInfo}>
          <Text style={styles.demoSectionTitle}>动作要点</Text>
          {exercise.steps.map((step) => (
            <View key={step} style={styles.demoRow}>
              <Ionicons name="checkmark-circle" size={19} color="#0f6eff" />
              <Text style={styles.demoRowText}>{step}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Text style={styles.warningTitle}>注意事项</Text>
          {exercise.cautions.map((caution) => (
            <View key={caution} style={styles.demoRow}>
              <Ionicons name="warning" size={18} color="#ffb000" />
              <Text style={styles.demoRowText}>{caution}</Text>
            </View>
          ))}
          <Pressable style={tapStyle(styles.startTrainingButton)}>
            <Ionicons name="play" size={21} color="#ffffff" />
            <Text style={styles.startTrainingText}>开始跟练</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ title, subtitle, onBack, darkText }: { title: string; subtitle: string; onBack: () => void; darkText?: boolean }) {
  return (
    <View style={styles.header}>
      <Pressable style={({ pressed }) => [styles.backButton, darkText && styles.backButtonLight, pressed && styles.tapFeedback]} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={darkText ? '#0d1d30' : '#ffffff'} />
      </Pressable>
      <View style={styles.headerTitleWrap}>
        <Text style={[styles.headerTitle, darkText && styles.headerTitleDark]}>{title}</Text>
        <Text style={[styles.headerSubtitle, darkText && styles.headerSubtitleDark]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function PrimaryButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={tapStyle(styles.primaryButton)} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#031629" />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={tapStyle(styles.secondaryButton)} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#b7c7dd" />
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function DangerButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={tapStyle(styles.dangerButton)} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#ffffff" />
      <Text style={styles.dangerButtonText}>{label}</Text>
    </Pressable>
  );
}

function PrimaryLightButton({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable disabled={disabled} style={({ pressed }) => [styles.primaryLightButton, pressed && styles.tapFeedback, disabled && styles.disabledButton]} onPress={onPress}>
      {loading ? <ActivityIndicator color="#ffffff" /> : <Ionicons name={icon} size={20} color="#ffffff" />}
      <Text style={styles.primaryLightButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  tapFeedback: {
    opacity: 0.62,
    transform: [{ scale: 0.96 }],
  },
  tapFeedbackStrong: {
    opacity: 0.55,
    transform: [{ scale: 0.94 }],
  },
  safe: { flex: 1 },
  homeContent: { padding: 22, paddingBottom: 42 },
  hero: { paddingTop: Platform.select({ ios: 8, default: 20 }), paddingBottom: 18 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 30 },
  brandMark: { alignItems: 'center', backgroundColor: '#05e1d2', borderRadius: 18, height: 42, justifyContent: 'center', width: 42 },
  brandTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  brandSubtitle: { color: '#bfd0e5', fontSize: 13, marginTop: 2 },
  heroTitle: { color: '#ffffff', fontSize: 31, fontWeight: '900', lineHeight: 39 },
  heroText: { color: '#c8d7ea', fontSize: 16, lineHeight: 24, marginTop: 14 },
  sectionLabel: { color: '#ebf5ff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  packageGrid: { gap: 12 },
  packageCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 20, flexDirection: 'row', gap: 14, minHeight: 76, padding: 16, shadowColor: '#002a5f', shadowOpacity: 0.16, shadowRadius: 14 },
  disabledCard: { opacity: 0.82 },
  packageIcon: { alignItems: 'center', backgroundColor: '#e8eef6', borderRadius: 17, height: 44, justifyContent: 'center', width: 44 },
  packageIconActive: { backgroundColor: '#1267e6' },
  packageCopy: { flex: 1 },
  packageTitle: { color: '#102033', fontSize: 19, fontWeight: '900' },
  packageSubtitle: { color: '#5a6c82', fontSize: 13, lineHeight: 19, marginTop: 5 },
  packageStatus: { color: '#7b8798', fontSize: 13, fontWeight: '800' },
  packageStatusActive: { color: '#1267e6' },
  heroBody: { color: '#d9e8f8', fontSize: 15, lineHeight: 23, marginTop: 14 },
  heroCompact: { paddingBottom: 18, paddingTop: 16 },
  heroKicker: { color: '#05e1d2', fontSize: 15, fontWeight: '900', marginBottom: 8 },
  heroTitleCompact: { color: '#ffffff', fontSize: 36, fontWeight: '900', lineHeight: 42 },
  todayPanel: { backgroundColor: '#ffffff', borderColor: '#dce6f2', borderRadius: 22, borderWidth: 1, gap: 12, marginBottom: 14, padding: 18, shadowColor: '#143664', shadowOpacity: 0.08, shadowRadius: 12 },
  todayHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  todayLabel: { color: '#1267e6', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  todayStatus: { backgroundColor: '#e8f2ff', borderRadius: 13, color: '#1267e6', fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  todayTitle: { color: '#102033', fontSize: 22, fontWeight: '900' },
  todayText: { color: '#4d6076', fontSize: 14, lineHeight: 21 },
  homeActionGrid: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  homeActionCard: { backgroundColor: '#ffffff', borderColor: '#dce6f2', borderRadius: 20, borderWidth: 1, flex: 1, gap: 8, minHeight: 134, padding: 15 },
  homeActionTitle: { color: '#102033', fontSize: 16, fontWeight: '900' },
  homeActionText: { color: '#60738d', fontSize: 12, lineHeight: 18 },
  educationList: { gap: 12, marginBottom: 18 },
  educationCard: { alignItems: 'flex-start', backgroundColor: '#ffffff', borderColor: '#dce6f2', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 15 },
  educationCopy: { flex: 1 },
  educationTitle: { color: '#102033', fontSize: 16, fontWeight: '900' },
  educationText: { color: '#60738d', fontSize: 13, lineHeight: 19, marginTop: 4 },
  educationHeroCard: { backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 24, borderWidth: 1, marginBottom: 14, padding: 18, shadowColor: '#143664', shadowOpacity: 0.08, shadowRadius: 12 },
  educationHeroIcon: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 22, height: 56, justifyContent: 'center', marginBottom: 14, width: 56 },
  educationHeroIconSupport: { backgroundColor: '#0b756d' },
  educationHeroTitle: { color: '#102033', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  educationHeroText: { color: '#53677f', fontSize: 14, lineHeight: 22, marginTop: 8 },
  lessonCard: { alignItems: 'flex-start', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 12, padding: 15 },
  lessonIcon: { alignItems: 'center', backgroundColor: '#e8f2ff', borderRadius: 18, height: 42, justifyContent: 'center', width: 42 },
  lessonCopy: { flex: 1 },
  lessonTitle: { color: '#102033', fontSize: 17, fontWeight: '900' },
  lessonBody: { color: '#60738d', fontSize: 14, lineHeight: 21, marginTop: 5 },
  educationSafetyNote: { alignItems: 'flex-start', backgroundColor: '#e8fbf8', borderColor: '#bdeee7', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 4, padding: 14 },
  educationSafetyText: { color: '#103c39', flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  feedbackHeroCard: { backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 24, borderWidth: 1, marginBottom: 14, padding: 18, shadowColor: '#143664', shadowOpacity: 0.08, shadowRadius: 12 },
  feedbackHeroIcon: { alignItems: 'center', backgroundColor: '#8b5cf6', borderRadius: 22, height: 56, justifyContent: 'center', marginBottom: 14, width: 56 },
  feedbackHeroTitle: { color: '#102033', fontSize: 24, fontWeight: '900' },
  feedbackHeroText: { color: '#53677f', fontSize: 14, lineHeight: 22, marginTop: 8 },
  feedbackInput: { backgroundColor: '#f3f7fc', borderColor: '#d9e3f0', borderRadius: 16, borderWidth: 1, color: '#102033', fontSize: 15, minHeight: 150, padding: 13 },
  feedbackCounter: { color: '#71839a', fontSize: 12, fontWeight: '800', marginTop: 7, textAlign: 'right' },
  feedbackConsentRow: { alignItems: 'flex-start', backgroundColor: '#eef3f9', borderColor: '#d9e3f0', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 12, padding: 13 },
  feedbackConsentText: { color: '#31445c', flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  tabHeroCard: { alignItems: 'flex-start', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 24, borderWidth: 1, gap: 12, marginBottom: 14, padding: 18, shadowColor: '#143664', shadowOpacity: 0.08, shadowRadius: 12 },
  tabHeroIcon: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 22, height: 56, justifyContent: 'center', width: 56 },
  tabHeroIconTeal: { backgroundColor: '#05e1d2' },
  tabHeroTitle: { color: '#102033', fontSize: 26, fontWeight: '900' },
  tabHeroText: { color: '#53677f', fontSize: 14, lineHeight: 22 },
  patientProfileCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 15, marginBottom: 14, padding: 18 },
  patientAvatar: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 30, height: 64, justifyContent: 'center', width: 64 },
  patientAvatarText: { color: '#ffffff', fontSize: 26, fontWeight: '900' },
  patientProfileCopy: { flex: 1 },
  logoutButton: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 8, marginTop: 16, padding: 12 },
  logoutButtonText: { color: '#c62828', fontSize: 14, fontWeight: '900' },
  roleGrid: { gap: 13 },
  roleCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 22, flexDirection: 'row', gap: 14, minHeight: 112, padding: 16, shadowColor: '#002a5f', shadowOpacity: 0.16, shadowRadius: 14 },
  roleIcon: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 22, height: 58, justifyContent: 'center', width: 58 },
  roleIconTeal: { backgroundColor: '#05e1d2' },
  roleCopy: { flex: 1 },
  roleTitle: { color: '#102033', fontSize: 20, fontWeight: '900' },
  roleText: { color: '#596c82', fontSize: 13, lineHeight: 19, marginTop: 5 },
  authCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 24, borderWidth: 1, padding: 18, shadowColor: '#143664', shadowOpacity: 0.08, shadowRadius: 12 },
  authIcon: { alignItems: 'center', backgroundColor: '#e8f2ff', borderRadius: 26, height: 74, justifyContent: 'center', marginBottom: 12, width: 74 },
  authTitle: { color: '#101d2c', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  authText: { color: '#60738d', fontSize: 14, lineHeight: 21, marginBottom: 14, marginTop: 8, textAlign: 'center' },
  authStatusText: { color: '#1267e6', fontSize: 13, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  createAccountCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 12, marginTop: 14, padding: 16 },
  createAccountCopy: { flex: 1 },
  createAccountTitle: { color: '#101d2c', fontSize: 16, fontWeight: '900' },
  createAccountText: { color: '#60738d', fontSize: 13, lineHeight: 19, marginTop: 4 },
  formCard: { backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 20, borderWidth: 1, marginBottom: 13, padding: 16 },
  formSectionTitle: { color: '#101d2c', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  formField: { marginBottom: 13, width: '100%' },
  formLabel: { color: '#31445c', fontSize: 13, fontWeight: '900', marginBottom: 8, marginTop: 4 },
  formInput: { backgroundColor: '#f3f7fc', borderColor: '#d9e3f0', borderRadius: 14, borderWidth: 1, color: '#102033', fontSize: 15, minHeight: 48, paddingHorizontal: 13 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  optionChip: { backgroundColor: '#eef3f9', borderColor: '#d9e3f0', borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
  optionChipActive: { backgroundColor: '#1267e6', borderColor: '#1267e6' },
  optionChipText: { color: '#40546c', fontSize: 12, fontWeight: '800' },
  optionChipTextActive: { color: '#ffffff' },
  consentNotice: { alignItems: 'flex-start', backgroundColor: '#e8f2ff', borderRadius: 16, flexDirection: 'row', gap: 10, marginTop: 4, padding: 13 },
  consentText: { color: '#26384d', flex: 1, fontSize: 12, lineHeight: 18 },
  therapistHeroCopy: { flex: 1 },
  therapistTitle: { color: '#31445c', fontSize: 14, fontWeight: '800', marginTop: 4 },
  therapistMeta: { color: '#66788f', fontSize: 13, marginTop: 4 },
  infoRow: { borderBottomColor: '#edf2f8', borderBottomWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { color: '#60738d', flex: 1, fontSize: 13, fontWeight: '800' },
  infoValue: { color: '#101d2c', flex: 1.4, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  profileTag: { backgroundColor: '#e8fbf8', borderRadius: 13, color: '#0b756d', fontSize: 12, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 7 },
  profileTagMuted: { backgroundColor: '#eef3f9', borderRadius: 13, color: '#496078', fontSize: 12, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 7 },
  screen: { flex: 1 },
  lightScreen: { backgroundColor: '#f5f8fd', flex: 1 },
  demoScreen: { backgroundColor: '#071426', flex: 1 },
  bottomTabBar: { alignItems: 'center', backgroundColor: '#ffffff', borderTopColor: '#dce6f2', borderTopWidth: 1, flexDirection: 'row', gap: 4, minHeight: Platform.select({ ios: 78, default: 72 }), paddingBottom: Platform.select({ ios: 12, default: 8 }), paddingHorizontal: 8, paddingTop: 8 },
  bottomTabItem: { alignItems: 'center', borderRadius: 18, flex: 1, gap: 3, justifyContent: 'center', minHeight: 54, paddingHorizontal: 2 },
  bottomTabItemActive: { backgroundColor: '#e8f2ff' },
  bottomTabText: { color: '#71839a', fontSize: 10, fontWeight: '900' },
  bottomTabTextActive: { color: '#1267e6' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: Platform.select({ ios: 8, default: 20 }), paddingBottom: 13 },
  backButton: { alignItems: 'center', borderRadius: 18, height: 40, justifyContent: 'center', width: 40 },
  backButtonLight: { backgroundColor: '#ffffff' },
  headerTitleWrap: { flex: 1 },
  headerTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  headerTitleDark: { color: '#0d1d30' },
  headerSubtitle: { color: '#bcd0e8', fontSize: 13, marginTop: 4 },
  headerSubtitleDark: { color: '#60738d' },
  content: { padding: 18, paddingBottom: 42 },
  lightContent: { padding: 18, paddingBottom: 42 },
  demoContent: { paddingBottom: 34 },
  progressPanel: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.11)', borderRadius: 18, borderWidth: 1, padding: 15 },
  progressTrack: { backgroundColor: '#18304f', borderRadius: 99, height: 9, overflow: 'hidden' },
  progressFill: { backgroundColor: '#05e1d2', height: '100%' },
  progressText: { color: '#c1d3ea', fontSize: 13, marginTop: 10 },
  actionStepper: { gap: 9, marginTop: 15 },
  stepPill: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 15, flexDirection: 'row', gap: 10, padding: 12 },
  stepPillActive: { backgroundColor: 'rgba(0,224,210,0.18)', borderColor: '#05e1d2', borderWidth: 1 },
  stepNumber: { color: '#d7e5f7', fontSize: 12, fontWeight: '900', textAlign: 'center', width: 28 },
  stepDone: { color: '#05e1d2' },
  stepFailed: { color: '#ffb020' },
  stepTitle: { color: '#c5d5ea', flex: 1, fontSize: 14, fontWeight: '700' },
  stepTitleActive: { color: '#ffffff' },
  currentActionCard: { backgroundColor: '#111e31', borderColor: '#22364f', borderRadius: 22, borderWidth: 1, marginTop: 16, padding: 18 },
  actionKicker: { color: '#05e1d2', fontSize: 13, fontWeight: '900' },
  currentActionTitle: { color: '#ffffff', fontSize: 26, fontWeight: '900', marginTop: 7 },
  currentActionTarget: { color: '#a9c3e1', fontSize: 15, marginTop: 5 },
  instructionBox: { alignItems: 'center', backgroundColor: '#0d2c39', borderColor: '#0b716e', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 16, padding: 14 },
  instructionText: { color: '#ffffff', flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  collectionGuideButton: {
    alignItems: 'center',
    backgroundColor: '#1267e6',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 11,
    marginTop: 13,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  collectionGuideCopy: { flex: 1 },
  collectionGuideTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  collectionGuideSource: { color: '#d7e5f7', fontSize: 12, fontWeight: '700', marginTop: 3 },
  cameraFrame: { aspectRatio: 0.78, backgroundColor: '#000000', borderColor: '#05e1d2', borderRadius: 24, borderWidth: 2, marginTop: 16, overflow: 'hidden' },
  camera: { flex: 1 },
  cameraEmpty: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 25 },
  cameraEmptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', marginTop: 15 },
  cameraEmptyText: { color: '#aabbd0', fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  cameraBadge: { alignItems: 'center', bottom: 12, flexDirection: 'row', gap: 6, left: 13, position: 'absolute' },
  cameraBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  cameraQualityOverlay: { alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(18,103,230,0.9)', borderRadius: 22, gap: 8, justifyContent: 'center', minWidth: 210, paddingHorizontal: 18, paddingVertical: 16, position: 'absolute', top: '38%' },
  cameraQualityOverlayPass: { backgroundColor: 'rgba(24,195,126,0.92)' },
  cameraQualityOverlayFail: { backgroundColor: 'rgba(255,159,10,0.92)' },
  cameraQualityOverlayText: { color: '#ffffff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  cameraQualityOverlayHint: { color: '#fff4cc', fontSize: 12, fontWeight: '800', lineHeight: 16, maxWidth: 240, textAlign: 'center' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  primaryButton: { alignItems: 'center', backgroundColor: '#05e1d2', borderRadius: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48, paddingHorizontal: 18 },
  primaryButtonText: { color: '#031629', fontSize: 15, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderColor: '#30445d', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48, paddingHorizontal: 18 },
  secondaryButtonText: { color: '#c9d7e8', fontSize: 15, fontWeight: '800' },
  dangerButton: { alignItems: 'center', backgroundColor: '#ff4f5e', borderRadius: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48, paddingHorizontal: 18 },
  dangerButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  qualityCard: { alignItems: 'center', backgroundColor: '#0e2238', borderColor: '#24415d', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 14, marginTop: 16, padding: 15 },
  qualityCopy: { flex: 1 },
  qualityTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  qualityTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  qualityText: { color: '#a9bed7', fontSize: 13, lineHeight: 19, marginTop: 5 },
  qualityTips: { gap: 6, marginTop: 10 },
  qualityTipRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 },
  qualityTipText: { color: '#ffe3a3', flex: 1, fontSize: 12, lineHeight: 17 },
  qualityBadge: { backgroundColor: '#0b716e', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  qualityBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  qualityButton: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 15, flexDirection: 'row', gap: 6, paddingHorizontal: 13, paddingVertical: 12 },
  disabledButton: { opacity: 0.45 },
  qualityButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  generateButton: { alignItems: 'center', backgroundColor: '#05e1d2', borderRadius: 18, flexDirection: 'row', gap: 9, justifyContent: 'center', marginTop: 18, minHeight: 56, paddingHorizontal: 10 },
  generateButtonDisabled: { opacity: 0.46 },
  generateButtonText: { color: '#031629', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  analysisScreen: { backgroundColor: '#071426', flex: 1 },
  analysisContent: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 22 },
  techCard: {
    alignItems: 'center',
    backgroundColor: '#0b2036',
    borderColor: '#05e1d2',
    borderRadius: 28,
    borderWidth: 1,
    height: 290,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  techGrid: {
    bottom: 0,
    left: 0,
    opacity: 0.46,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  techGridLineHorizontal: {
    backgroundColor: 'rgba(223,248,255,0.09)',
    height: 1,
    left: 22,
    position: 'absolute',
    right: 22,
  },
  techGridLineVertical: {
    backgroundColor: 'rgba(223,248,255,0.08)',
    bottom: 24,
    position: 'absolute',
    top: 24,
    width: 1,
  },
  techScanLine: {
    backgroundColor: 'rgba(5,225,210,0.2)',
    borderColor: 'rgba(5,225,210,0.36)',
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    left: 20,
    position: 'absolute',
    right: 20,
    top: 118,
  },
  dataChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,225,210,0.14)',
    borderColor: 'rgba(5,225,210,0.44)',
    borderRadius: 12,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    minWidth: 62,
    position: 'absolute',
  },
  dataChipTop: { left: 52, top: 37 },
  dataChipBottom: { bottom: 40, right: 52 },
  dataChipText: { color: '#dff8ff', fontSize: 11, fontWeight: '900', letterSpacing: 0 },
  techOrbitOuter: {
    borderColor: 'rgba(5,225,210,0.45)',
    borderRadius: 95,
    borderRightColor: '#05e1d2',
    borderTopColor: '#05e1d2',
    borderWidth: 2,
    height: 190,
    position: 'absolute',
    width: 190,
  },
  techOrbitInner: {
    borderColor: 'rgba(18,103,230,0.34)',
    borderBottomColor: '#1267e6',
    borderLeftColor: '#1267e6',
    borderRadius: 64,
    borderWidth: 2,
    height: 128,
    position: 'absolute',
    width: 128,
  },
  techCore: {
    alignItems: 'center',
    backgroundColor: '#071426',
    borderColor: '#24415d',
    borderRadius: 52,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    shadowColor: '#05e1d2',
    shadowOpacity: 0.3,
    shadowRadius: 22,
    width: 104,
  },
  techCoreText: { color: '#ffffff', fontSize: 13, fontWeight: '900', marginTop: 6 },
  techNode: {
    backgroundColor: '#05e1d2',
    borderColor: '#dff8ff',
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    position: 'absolute',
    width: 16,
  },
  techNodeTop: { top: 45 },
  techNodeRight: { right: 56, top: 137 },
  techNodeBottom: { bottom: 47 },
  techNodeLeft: { left: 56, top: 137 },
  techBarOne: { backgroundColor: 'rgba(5,225,210,0.22)', borderRadius: 99, bottom: 36, height: 8, left: 52, position: 'absolute', width: 88 },
  techBarTwo: { backgroundColor: 'rgba(18,103,230,0.34)', borderRadius: 99, bottom: 36, height: 8, left: 148, position: 'absolute', width: 58 },
  techBarThree: { backgroundColor: 'rgba(223,248,255,0.22)', borderRadius: 99, bottom: 54, height: 8, left: 84, position: 'absolute', width: 126 },
  analysisTitle: { color: '#ffffff', fontSize: 25, fontWeight: '900', marginTop: 26, textAlign: 'center' },
  analysisText: { color: '#b9cbe2', fontSize: 15, lineHeight: 23, marginTop: 10, textAlign: 'center' },
  analysisProgressTrack: {
    backgroundColor: 'rgba(223,248,255,0.12)',
    borderRadius: 99,
    height: 8,
    marginTop: 18,
    overflow: 'hidden',
    width: '82%',
  },
  analysisProgressGlow: {
    backgroundColor: '#05e1d2',
    borderRadius: 99,
    height: 8,
    shadowColor: '#05e1d2',
    shadowOpacity: 0.85,
    shadowRadius: 14,
    width: 86,
  },
  analysisStatusCard: {
    backgroundColor: '#0e2238',
    borderColor: '#24415d',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginTop: 22,
    padding: 16,
    width: '100%',
  },
  analysisStatusRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  analysisStatusText: { color: '#e6f1ff', flex: 1, fontSize: 15, fontWeight: '800' },
  weeklyLoadingContent: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  weeklyLoadingIcon: {
    alignItems: 'center',
    backgroundColor: '#0b2036',
    borderColor: '#05e1d2',
    borderRadius: 40,
    borderWidth: 1,
    height: 118,
    justifyContent: 'center',
    shadowColor: '#05e1d2',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    width: 118,
  },
  weeklyLoadingDot: {
    backgroundColor: '#1267e6',
    borderColor: '#dff8ff',
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    position: 'absolute',
    right: 28,
    top: 28,
    width: 16,
  },
  weeklyLoadingTitle: { color: '#ffffff', fontSize: 27, fontWeight: '900', marginTop: 28, textAlign: 'center' },
  weeklyLoadingText: { color: '#b9cbe2', fontSize: 15, lineHeight: 23, marginTop: 10, maxWidth: 330, textAlign: 'center' },
  weeklyProgressTrack: {
    backgroundColor: 'rgba(223,248,255,0.12)',
    borderRadius: 99,
    height: 14,
    marginTop: 28,
    overflow: 'hidden',
    width: '100%',
  },
  weeklyProgressFill: {
    backgroundColor: '#1267e6',
    borderRadius: 99,
    height: '100%',
    overflow: 'hidden',
  },
  weeklyProgressShimmer: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    height: '100%',
    width: 72,
  },
  weeklyStepCard: {
    backgroundColor: '#0e2238',
    borderColor: '#24415d',
    borderRadius: 20,
    borderWidth: 1,
    gap: 13,
    marginTop: 24,
    padding: 17,
    width: '100%',
  },
  weeklyStepRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  weeklyStepIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,225,210,0.16)',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  weeklyStepNumber: { color: '#05e1d2', fontSize: 13, fontWeight: '900' },
  weeklyStepText: { color: '#e6f1ff', flex: 1, fontSize: 15, fontWeight: '800' },
  problemCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 12, minHeight: 146, padding: 12, shadowColor: '#143664', shadowOpacity: 0.08, shadowRadius: 12 },
  analysisNoticeCard: { alignItems: 'flex-start', backgroundColor: '#e8f2ff', borderColor: '#cfe1f7', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 12, padding: 14 },
  analysisNoticeText: { color: '#26384d', flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  problemIndex: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  problemIndexText: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  problemIllustration: { backgroundColor: '#edf5ff', borderColor: '#d9e8f7', borderRadius: 18, borderWidth: 1, height: 112, overflow: 'hidden', width: 112 },
  problemImage: { height: '100%', width: '100%' },
  problemCopy: { flex: 1 },
  problemArea: { color: '#1267e6', fontSize: 12, fontWeight: '900' },
  problemTitle: { color: '#101d2c', fontSize: 18, fontWeight: '900', marginTop: 3 },
  problemSummary: { color: '#26384d', fontSize: 15, fontWeight: '800', lineHeight: 21, marginTop: 7 },
  metricsHero: { backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 22, borderWidth: 1, marginBottom: 14, padding: 18 },
  metricsHeroTitle: { color: '#102033', fontSize: 24, fontWeight: '900' },
  metricsHeroText: { color: '#60738d', fontSize: 14, lineHeight: 21, marginTop: 8 },
  metricCard: { backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 20, borderWidth: 1, marginBottom: 12, padding: 15 },
  metricHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  metricIcon: { alignItems: 'center', borderRadius: 18, height: 44, justifyContent: 'center', width: 44 },
  metricCopy: { flex: 1 },
  metricLabel: { color: '#60738d', fontSize: 13, fontWeight: '900' },
  metricValue: { color: '#102033', fontSize: 26, fontWeight: '900', marginTop: 2 },
  metricTrack: { backgroundColor: '#edf2f8', borderRadius: 999, height: 10, marginTop: 14, overflow: 'hidden' },
  metricFill: { borderRadius: 999, height: 10 },
  metricHint: { color: '#60738d', fontSize: 12, lineHeight: 18, marginTop: 9 },
  problemDetail: { color: '#68788c', fontSize: 12, lineHeight: 18, marginTop: 5 },
  tipCard: { backgroundColor: '#e8f2ff', borderRadius: 18, flexDirection: 'row', gap: 12, marginTop: 5, padding: 16 },
  tipCopy: { flex: 1 },
  tipTitle: { color: '#1267e6', fontSize: 16, fontWeight: '900' },
  tipText: { color: '#26384d', fontSize: 14, lineHeight: 21, marginTop: 5 },
  primaryLightButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#1267e6', borderRadius: 18, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 18, minHeight: 56, paddingHorizontal: 18 },
  primaryLightButtonText: { color: '#ffffff', flexShrink: 1, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  axonMatchButton: { alignItems: 'center', backgroundColor: '#05e1d2', borderRadius: 18, flexDirection: 'row', gap: 11, justifyContent: 'center', marginTop: 14, minHeight: 68, paddingHorizontal: 15, paddingVertical: 12 },
  axonMatchIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.38)', borderRadius: 18, height: 42, justifyContent: 'center', width: 42 },
  axonMatchCopy: { flex: 1 },
  axonMatchTitle: { color: '#031629', fontSize: 17, fontWeight: '900' },
  axonMatchText: { color: '#064144', fontSize: 12, fontWeight: '800', lineHeight: 17, marginTop: 3 },
  inlineDemoButton: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  inlineDemoText: { color: '#1267e6', fontSize: 15, fontWeight: '900' },
  weekPanel: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e7dfd1', borderRadius: 22, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, padding: 18 },
  opensimNoticeCard: { alignItems: 'flex-start', backgroundColor: '#e8fbf8', borderColor: '#bdeee7', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 12, padding: 13 },
  opensimNoticeText: { color: '#103c39', flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  weekTitle: { color: '#101d2c', fontSize: 24, fontWeight: '900' },
  weekDate: { color: '#60738d', fontSize: 14, fontWeight: '700', marginTop: 4 },
  weekCount: { color: '#1267e6', fontSize: 16, fontWeight: '900' },
  dayPager: { gap: 12, marginBottom: 16, paddingRight: 28 },
  dayPlanCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 92, paddingHorizontal: 18, paddingVertical: 15, width: 304 },
  dayPlanCardActive: { backgroundColor: '#1267e6', borderColor: '#1267e6' },
  dayText: { color: '#53677f', fontSize: 13, fontWeight: '900' },
  dayTextActive: { color: '#dfeeff' },
  dayPlanTitle: { color: '#101d2c', fontSize: 21, fontWeight: '900', marginTop: 4 },
  dayPlanTitleActive: { color: '#ffffff' },
  dayPlanHint: { color: '#60738d', fontSize: 13, fontWeight: '800', marginTop: 4 },
  dayPlanHintActive: { color: '#dfeeff' },
  exerciseCard: { alignItems: 'center', backgroundColor: '#fffdf7', borderColor: '#e7dfd1', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 16, marginBottom: 14, minHeight: 156, padding: 14, shadowColor: '#8a7350', shadowOpacity: 0.08, shadowRadius: 12 },
  exerciseThumb: { backgroundColor: '#eef5ff', borderRadius: 18, height: 116, overflow: 'hidden', width: 132 },
  exerciseCoverImage: { height: '100%', width: '100%' },
  exerciseCopy: { flex: 1 },
  exerciseTitle: { color: '#101d2c', fontSize: 20, fontWeight: '900', lineHeight: 24 },
  exerciseImproves: { color: '#596c82', fontSize: 15, lineHeight: 21, marginTop: 7 },
  exerciseDose: { color: '#101d2c', fontSize: 18, fontWeight: '900', lineHeight: 22, marginTop: 10 },
  exerciseStatus: { alignItems: 'center', backgroundColor: '#e8f2ff', borderRadius: 18, flexDirection: 'row', gap: 2, paddingHorizontal: 11, paddingVertical: 8 },
  exerciseStatusText: { color: '#1267e6', fontSize: 13, fontWeight: '900' },
  matchScreen: { backgroundColor: '#071426', flex: 1 },
  matchContent: { flex: 1, justifyContent: 'center', padding: 20 },
  networkCanvas: { alignItems: 'center', alignSelf: 'center', height: 300, justifyContent: 'center', marginBottom: 22, width: '100%' },
  networkRing: { borderColor: '#05e1d2', borderRadius: 112, borderWidth: 2, height: 224, position: 'absolute', width: 224 },
  networkCore: { alignItems: 'center', backgroundColor: '#0b2a42', borderColor: '#05e1d2', borderRadius: 52, borderWidth: 1, height: 104, justifyContent: 'center', shadowColor: '#05e1d2', shadowOpacity: 0.28, shadowRadius: 20, width: 104 },
  networkCoreText: { color: '#ffffff', fontSize: 14, fontWeight: '900', marginTop: 6 },
  networkNode: { alignItems: 'center', backgroundColor: '#0e2238', borderColor: '#1f95a2', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 11, paddingVertical: 8, position: 'absolute' },
  networkNodeText: { color: '#dff8ff', fontSize: 12, fontWeight: '900' },
  candidateCard: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 22, flexDirection: 'row', gap: 14, padding: 16 },
  avatarLarge: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  avatarText: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  candidateCopy: { flex: 1 },
  matchingLabel: { color: '#0b756d', fontSize: 12, fontWeight: '900' },
  candidateName: { color: '#101d2c', fontSize: 20, fontWeight: '900', marginTop: 3 },
  candidateTitle: { color: '#5b7088', fontSize: 13, marginTop: 4 },
  matchHint: { color: '#b9cbe2', fontSize: 14, lineHeight: 21, marginTop: 18, textAlign: 'center' },
  therapistHeroCard: { backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 22, borderWidth: 1, padding: 16 },
  therapistHeaderRow: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  therapistAvatar: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 34, height: 68, justifyContent: 'center', width: 68 },
  therapistAvatarText: { color: '#ffffff', fontSize: 30, fontWeight: '900' },
  therapistTitleWrap: { flex: 1 },
  therapistName: { color: '#101d2c', fontSize: 24, fontWeight: '900' },
  therapistRole: { color: '#31445c', fontSize: 14, fontWeight: '800', marginTop: 4 },
  therapistHospital: { color: '#66788f', fontSize: 13, marginTop: 4 },
  matchScoreBadge: { alignItems: 'center', backgroundColor: '#e8f2ff', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8 },
  matchScoreText: { color: '#1267e6', fontSize: 17, fontWeight: '900' },
  matchScoreLabel: { color: '#1267e6', fontSize: 11, fontWeight: '800', marginTop: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  therapistTag: { backgroundColor: '#eef6ff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  therapistTagText: { color: '#1267e6', fontSize: 12, fontWeight: '900' },
  profileSection: { backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 18, borderWidth: 1, marginTop: 13, padding: 16 },
  profileSectionTitle: { color: '#101d2c', fontSize: 18, fontWeight: '900', marginBottom: 11 },
  profileRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, marginBottom: 10 },
  profileRowText: { color: '#31445c', flex: 1, fontSize: 14, lineHeight: 21 },
  focusPill: { alignItems: 'center', backgroundColor: '#e8fbf8', borderRadius: 15, flexDirection: 'row', gap: 8, marginBottom: 9, paddingHorizontal: 12, paddingVertical: 10 },
  focusPillText: { color: '#103c39', flex: 1, fontSize: 14, fontWeight: '800' },
  confirmTherapistButton: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 18, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 18, minHeight: 56 },
  confirmTherapistText: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  waitingScreen: { backgroundColor: '#071426', flex: 1 },
  waitingContent: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  waitingIconWrap: { alignItems: 'center', backgroundColor: '#0b2a42', borderColor: '#05e1d2', borderRadius: 46, borderWidth: 1, height: 92, justifyContent: 'center', width: 92 },
  waitingTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 22, textAlign: 'center' },
  waitingText: { color: '#b9cbe2', fontSize: 15, lineHeight: 23, marginTop: 12, textAlign: 'center' },
  waitingStatusCard: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, flexDirection: 'row', gap: 9, marginTop: 24, paddingHorizontal: 18, paddingVertical: 14 },
  waitingStatusText: { color: '#102033', fontSize: 15, fontWeight: '900' },
  videoPanel: { backgroundColor: '#000000' },
  demoImage: { alignItems: 'center', height: 330, justifyContent: 'center' },
  demoVideo: { backgroundColor: '#000000', height: 330, width: '100%' },
  demoPlaceholderText: { bottom: 22, color: '#164b85', fontSize: 12, fontWeight: '900', left: 18, position: 'absolute', right: 18, textAlign: 'center' },
  therapistFigure: { alignItems: 'center', justifyContent: 'center' },
  handIcon: { position: 'absolute', right: -28, top: 82, transform: [{ rotate: '-16deg' }] },
  playButton: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 34, bottom: 46, height: 68, justifyContent: 'center', position: 'absolute', width: 68 },
  videoProgress: { backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 99, bottom: 17, height: 6, left: 25, overflow: 'hidden', position: 'absolute', right: 25 },
  videoProgressFill: { backgroundColor: '#1267e6', height: '100%' },
  demoInfo: { backgroundColor: '#071426', padding: 20 },
  collectionViewBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#e8f2ff', borderRadius: 999, flexDirection: 'row', gap: 7, marginBottom: 14, paddingHorizontal: 12, paddingVertical: 8 },
  collectionViewBadgeText: { color: '#0f4fb5', fontSize: 13, fontWeight: '900' },
  demoSectionTitle: { color: '#05e1d2', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  demoRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, marginBottom: 10 },
  demoRowText: { color: '#e6f1ff', flex: 1, fontSize: 15, lineHeight: 22 },
  divider: { backgroundColor: '#23415f', height: 1, marginVertical: 12 },
  warningTitle: { color: '#ffca45', fontSize: 19, fontWeight: '900', marginBottom: 10 },
  startTrainingButton: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 18, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 18, minHeight: 56 },
  startTrainingText: { color: '#ffffff', fontSize: 19, fontWeight: '900' },
});
