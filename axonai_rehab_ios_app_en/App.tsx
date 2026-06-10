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
  | 'assessment'
  | 'patientTraining'
  | 'patientCare'
  | 'patientMe'
  | 'collect'
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
  cameraView: 'Front view' | 'Side view';
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
    title: 'Upper Limb Package',
    subtitle: 'Shoulder, elbow, forearm, wrist, and hand coordination',
    icon: 'fitness',
    active: true,
  },
  { key: 'hand', title: 'Hand Function Package', subtitle: 'Grasp, release, and fine motor tasks', icon: 'hand-left', active: false },
  { key: 'gait', title: 'Gait Package', subtitle: 'Walking stability and gait symmetry', icon: 'walk', active: false },
  { key: 'balance', title: 'Balance Package', subtitle: 'Sitting, standing, and center-of-mass control', icon: 'body', active: false },
  { key: 'trunk', title: 'Trunk Control Package', subtitle: 'Trunk stability, turning, and sitting control', icon: 'accessibility', active: false },
];

const upperActions: CollectionAction[] = [
  {
    id: 'shoulder-flexion',
    title: 'Shoulder Flexion / Elevation',
    target: 'Active shoulder elevation',
    instruction: 'Sit upright, slowly lift the affected arm forward and upward, then lower it with control.',
    cameraView: 'Side view',
    viewInstruction: 'Record from the side of the affected arm so the shoulder, elbow, wrist, and trunk are visible.',
    guideScript: 'Sit tall in a chair. Turn your body sideways to the camera. Start with the arm relaxed, slowly lift it forward as high as comfortable, pause, then lower with control.',
  },
  {
    id: 'shoulder-abduction',
    title: 'Shoulder Abduction',
    target: 'Shoulder abduction and shoulder-hike compensation',
    instruction: 'Raise the affected arm from the side of the body to shoulder height, then lower it slowly.',
    cameraView: 'Front view',
    viewInstruction: 'Record from the front so both shoulders and the full affected arm stay in frame.',
    guideScript: 'Face the camera. Keep the trunk still. Raise the affected arm out to the side toward shoulder height, pause, then lower slowly.',
  },
  {
    id: 'hand-mouth',
    title: 'Hand to Mouth',
    target: 'Elbow flexion and functional feeding movement',
    instruction: 'Lift the affected hand from the table or thigh, lightly touch the mouth area, then return.',
    cameraView: 'Side view',
    viewInstruction: 'Record from the side of the affected arm so the elbow bend and hand path are visible.',
    guideScript: 'Sit sideways to the camera. Start with the hand on your thigh or table. Bring the hand toward the mouth, touch lightly, then return slowly.',
  },
  {
    id: 'reach',
    title: 'Forward Reach',
    target: 'Forward reach, elbow extension, and endpoint control',
    instruction: 'From sitting, reach forward to touch the target object, then return to the starting position.',
    cameraView: 'Side view',
    viewInstruction: 'Record from the side so the trunk, shoulder, elbow, and target object are visible.',
    guideScript: 'Sit sideways to the camera with a target in front of you. Reach forward to touch the target without leaning too much, then return.',
  },
  {
    id: 'elbow',
    title: 'Elbow Flexion / Extension',
    target: 'Elbow control',
    instruction: 'Keep the upper arm close to the body and repeatedly bend and straighten the elbow.',
    cameraView: 'Side view',
    viewInstruction: 'Record from the side of the affected arm so the full elbow bend and straighten are visible.',
    guideScript: 'Sit sideways to the camera. Keep the upper arm close to the body. Bend and straighten the elbow slowly three times.',
  },
  {
    id: 'forearm',
    title: 'Forearm Pronation / Supination',
    target: 'Palm turning ability',
    instruction: 'Bend the elbow about 90 degrees and slowly turn the palm up and down.',
    cameraView: 'Front view',
    viewInstruction: 'Record from the front with the elbow bent so the palm turning up and down is clear.',
    guideScript: 'Face the camera. Bend the elbow to about 90 degrees. Slowly turn the palm up, then down, without moving the shoulder too much.',
  },
  {
    id: 'wrist',
    title: 'Wrist Extension',
    target: 'Wrist extensor control',
    instruction: 'Support the forearm, lift the wrist upward and hold, then slowly lower it.',
    cameraView: 'Side view',
    viewInstruction: 'Record from the side so the wrist lifting upward is easy to see.',
    guideScript: 'Place the forearm on a table with the hand over the edge. Lift the wrist upward, hold briefly, then lower slowly.',
  },
  {
    id: 'grasp',
    title: 'Grasp and Release',
    target: 'Finger opening and release ability',
    instruction: 'Hold a soft ball or towel, squeeze it, then actively open the hand and release.',
    cameraView: 'Front view',
    viewInstruction: 'Record from the front with the hand close enough to see finger opening and release.',
    guideScript: 'Face the camera. Hold a soft object, squeeze gently, then open the hand and release it as clearly as possible.',
  },
  {
    id: 'finger-nose',
    title: 'Finger-to-Nose / Target Touch',
    target: 'Upper-limb coordination and accuracy',
    instruction: 'Use the affected index finger to touch the nose or screen target several times.',
    cameraView: 'Front view',
    viewInstruction: 'Record from the front so the finger path, target, and trunk are visible.',
    guideScript: 'Face the camera. Touch your nose or the target with the affected index finger, return, and repeat slowly.',
  },
];

const demoProblems: Problem[] = [
  {
    title: 'Limited Active Elevation',
    summary: 'The affected arm tends to stop early during lifting',
    detail: 'This may relate to limited shoulder control or reduced scapular stability.',
    area: 'Shoulder Joint',
    accent: '#0f6eff',
    icon: 'body',
  },
  {
    title: 'Clear Trunk / Scapular Compensation',
    summary: 'The body assists during lifting and reaching',
    detail: 'This may appear as shoulder hiking, trunk leaning, or backward extension.',
    area: 'Scapular Stability',
    accent: '#00b8a9',
    icon: 'git-compare',
  },
  {
    title: 'Weak Wrist Extension and Release',
    summary: 'Opening the hand after grasping is not smooth enough',
    detail: 'This may affect holding cups, releasing objects, and dressing tasks.',
    area: 'Wrist and Hand',
    accent: '#ff8a00',
    icon: 'hand-left',
  },
];

const exercises: Exercise[] = [
  {
    id: 'table-slide',
    title: 'Table Slide Forward Elevation',
    improves: 'Improves limited active shoulder elevation',
    dose: '3 sets x 12 reps',
    dayPattern: [1, 2, 3, 4, 5, 6],
    imageTone: '#dff7ff',
    coverImage: require('./assets/exercise-covers/table-slide.png'),
    steps: [
      'Sit with the forearm placed on a towel.',
      'Keep the body upright and slowly slide the affected hand forward.',
      'Pause for 2 seconds at a controllable range, then slide back.',
    ],
    cautions: ['Do not hike the shoulder.', 'Do not lean backward to replace arm lifting.', 'Stop if shoulder pain is obvious.'],
  },
  {
    id: 'scapula-setting',
    title: 'Scapular Setting',
    improves: 'Reduces shoulder hiking and trunk compensation',
    dose: '3 sets x 10 reps',
    dayPattern: [1, 2, 4, 5, 7],
    imageTone: '#eaf2ff',
    coverImage: require('./assets/exercise-covers/scapula-setting.png'),
    steps: [
      'Sit with both shoulders relaxed.',
      'Gently draw the shoulder blade back and down without shrugging.',
      'Hold for 3 seconds, relax, and repeat.',
    ],
    cautions: ['Keep the movement gentle.', 'Keep the neck relaxed.', 'Breathe naturally.'],
  },
  {
    id: 'elbow-reach',
    title: 'Seated Elbow Extension Reach',
    improves: 'Improves forward reaching and elbow extension control',
    dose: '3 sets x 8 reps',
    dayPattern: [1, 3, 5, 6],
    imageTone: '#fff4db',
    coverImage: require('./assets/exercise-covers/elbow-reach.png'),
    steps: ['Place a cup on the table.', 'Slowly reach forward with the affected hand.', 'Touch the target, then return steadily.'],
    cautions: ['Do not place the target too far away.', 'Do not lunge forward suddenly.', 'Keep sitting stable.'],
  },
  {
    id: 'wrist-open',
    title: 'Wrist Lift and Hand Opening',
    improves: 'Improves wrist extension and grasp-release difficulty',
    dose: '3 sets x 12 reps',
    dayPattern: [2, 3, 4, 6, 7],
    imageTone: '#ffe9df',
    coverImage: require('./assets/exercise-covers/wrist-open.png'),
    steps: ['Place the forearm on the table with the palm facing down.', 'Gently lift the wrist upward.', 'Open the fingers and hold for 2 seconds.'],
    cautions: ['Do not hold your breath.', 'Do not forcefully pull the fingers with the other hand.', 'Reduce reps if finger spasticity is obvious.'],
  },
];

const matchedPerson: MatchedPerson = {
  name: 'Emily Chen',
  title: 'Neurological Rehabilitation Therapist',
  organization: 'Shanghai Neurorehabilitation Center',
  matchScore: '96%',
  tags: ['Stroke Upper Limb', 'Shoulder-Hand Prevention', 'Home Training'],
  experience: [
    '8 years of stroke rehabilitation experience, with long-term focus on upper-limb functional recovery.',
    'Experienced with Fugl-Meyer Upper Extremity Assessment, ARAT, and daily living training.',
    'Skilled at translating video-observed movement problems into daily executable training tasks.',
  ],
  focus: ['Limited active shoulder elevation', 'Scapular and trunk compensation', 'Wrist extension and grasp-release control'],
};

const supportNames = [
  'Therapist - Emily Chen',
  'Care Aide - Mrs. Zhao',
  'Companion - Leo Liu',
  'Technician - Mark Zhou',
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail ?? message;
    } catch {
      // Keep the HTTP status when the backend does not return JSON.
    }
    throw new Error(message);
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
    const profile = await readSupabaseProfile(role, userId);
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

async function requestAvailableTherapists(): Promise<Array<{ userId: string; identifier: string; profile: TherapistProfile }>> {
  const response = await fetch(`${apiBaseUrl}/api/rehab/therapists`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body = await response.json();
  return (body.therapists ?? []) as Array<{ userId: string; identifier: string; profile: TherapistProfile }>;
}

const defaultPatientProfile: PatientProfile = {
  fullName: 'Demo Patient',
  ageRange: '55-64',
  gender: 'Prefer not to say',
  language: 'English',
  location: 'London / GMT',
  strokeType: 'Unknown',
  onsetTime: 'More than 6 months',
  affectedSide: 'Right',
  dominantHand: 'Right',
  mobilityLevel: 'Needs some assistance',
  upperLimbAbility: 'Can lift arm partly, grasp is limited',
  safetyFlags: ['Shoulder pain'],
  mainGoal: 'Reach and use the affected hand in daily tasks',
  supportMode: 'Remote',
};

const defaultTherapistProfile: TherapistProfile = {
  fullName: 'Emily Chen',
  title: 'Neurological Rehabilitation Therapist',
  profession: 'Physiotherapist',
  location: 'London / GMT',
  languages: 'English, Mandarin',
  yearsExperience: '8+ years',
  strokeExperience: '5+ years',
  specialties: ['Upper-limb rehab', 'Hand function', 'Home exercise programs', 'Tele-rehab'],
  assessments: ['Fugl-Meyer UE', 'ARAT', 'WMFT'],
  supportMode: 'Remote',
  availability: 'Weekdays and Saturday mornings',
};

const patientOptionSets = {
  ageRange: ['45-54', '55-64', '65-74'],
  gender: ['Female', 'Male', 'Prefer not to say'],
  strokeType: ['Ischemic', 'Hemorrhagic', 'Unknown'],
  onsetTime: ['0-3 months', '3-6 months', 'More than 6 months'],
  affectedSide: ['Left', 'Right', 'Both/Unsure'],
  dominantHand: ['Left', 'Right', 'Both/Unsure'],
  mobilityLevel: ['Independent', 'Needs some assistance', 'Wheelchair mostly'],
  supportMode: ['Remote', 'In-person', 'Either'],
};

const therapistOptionSets = {
  profession: ['Physiotherapist', 'Occupational Therapist', 'Rehabilitation Physician'],
  yearsExperience: ['1-2 years', '3-5 years', '8+ years'],
  strokeExperience: ['1-2 years', '3-5 years', '5+ years'],
  supportMode: ['Remote', 'In-person', 'Hybrid'],
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
      evidence: ['Fallback result shown because backend analysis was unavailable.'],
    })),
    opensimDecision: {
      needed: false,
      priority: 'backend_unavailable_fallback',
      reasons: ['Backend analysis was unavailable; showing safe demo fallback only.'],
      recommended_workflow: ['Start backend API to receive real algorithm output.'],
    },
    weeklyExercisePlan: exercises.map((exercise) => ({
      exercise_id: exercise.id,
      name: exercise.title,
      improves: [exercise.improves],
      dose: exercise.dose,
      days: weekDays,
      instructions: exercise.steps,
      precautions: exercise.cautions,
      progression: 'Progress only when movement is controlled and pain-free.',
    })),
    patientFacingSummary: {
      title: 'Your upper-limb training priorities',
      problems: demoProblems.map((problem) => problem.summary),
      trainingFocus: exercises.map((exercise) => exercise.title),
      reviewNote: 'Backend unavailable; this is a prototype fallback.',
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

function toneForExercise(exerciseId: string): { imageTone: string; coverImage: ImageSourcePropType } {
  if (exerciseId.includes('scapular')) return { imageTone: '#eaf2ff', coverImage: require('./assets/exercise-covers/scapula-setting.png') };
  if (exerciseId.includes('reach') || exerciseId.includes('elbow')) return { imageTone: '#fff4db', coverImage: require('./assets/exercise-covers/elbow-reach.png') };
  if (exerciseId.includes('wrist') || exerciseId.includes('grasp')) return { imageTone: '#ffe9df', coverImage: require('./assets/exercise-covers/wrist-open.png') };
  return { imageTone: '#dff7ff', coverImage: require('./assets/exercise-covers/table-slide.png') };
}

function mapApiExercise(item: ApiExercisePlanItem): Exercise {
  const tone = toneForExercise(item.exercise_id);
  return {
    id: item.exercise_id,
    title: item.name,
    improves: patientFriendlyImproves(item.improves),
    dose: item.dose,
    dayPattern: item.days
      .map((day) => weekDays.findIndex((value) => value === day) + 1)
      .filter((day) => day > 0),
    imageTone: tone.imageTone,
    coverImage: tone.coverImage,
    steps: item.instructions,
    cautions: item.precautions,
  };
}

function patientFriendlyImproves(items: string[]): string {
  const labels: Record<string, string> = {
    limited_active_shoulder_elevation: 'Reaching and lifting the arm',
    trunk_or_scapular_compensation: 'Keeping the body steady during arm movement',
    wrist_hand_release_difficulty: 'Opening the hand and releasing objects',
    elbow_extension_control: 'Straightening the elbow for reaching',
    forearm_rotation_limitation: 'Turning the palm up and down',
    upper_limb_coordination_deficit: 'Accurate hand control and coordination',
  };
  const readable = items.map((item) => labels[item] ?? item.replace(/_/g, ' '));
  return `Improves ${readable.join(', ')}`;
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
  formData.append('affected_side', patientProfile.affectedSide === 'Both/Unsure' ? 'auto' : patientProfile.affectedSide.toLowerCase());
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
    throw new Error(`HTTP ${response.status}`);
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
  formData.append('affected_side', affectedSide === 'Both/Unsure' ? 'auto' : affectedSide.toLowerCase());
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
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail ?? message;
    } catch {
      // Keep the HTTP status when the backend does not return JSON.
    }
    throw new Error(message);
  }
  return (await response.json()) as VideoQualityResult;
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
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageKey | null>(null);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [recordedVideos, setRecordedVideos] = useState<Record<string, string>>({});
  const [qualityPassed, setQualityPassed] = useState<Record<string, boolean>>({});
  const [qualityResults, setQualityResults] = useState<Record<string, VideoQualityResult>>({});
  const [qualityCheckingActionId, setQualityCheckingActionId] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraOpen, setCameraOpen] = useState(false);
  const [isRecording, setRecording] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(exercises[0]);
  const [showDemo, setShowDemo] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<UpperLimbAnalysisResult | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  const currentAction = upperActions[currentActionIndex];
  const completedCount = upperActions.filter((action) => qualityPassed[action.id]).length;
  const canGeneratePlan = completedCount === upperActions.length;
  const analysisExercises = useMemo(
    () => (analysisResult?.weeklyExercisePlan.length ? analysisResult.weeklyExercisePlan.map(mapApiExercise) : exercises),
    [analysisResult],
  );
  const dayExercises = useMemo(() => analysisExercises.filter((exercise) => exercise.dayPattern.includes(selectedDay)), [analysisExercises, selectedDay]);
  const matchedTherapist = useMemo<MatchedPerson>(() => {
    const languageFit = therapistProfile.languages.toLowerCase().includes(patientProfile.language.toLowerCase());
    const remoteFit = therapistProfile.supportMode === 'Hybrid' || therapistProfile.supportMode === patientProfile.supportMode;
    const score = 82 + (languageFit ? 6 : 0) + (remoteFit ? 5 : 0) + (therapistProfile.specialties.includes('Upper-limb rehab') ? 4 : 0);

    return {
      name: therapistProfile.fullName || matchedPerson.name,
      title: therapistProfile.title || matchedPerson.title,
      organization: `${therapistProfile.location || 'Remote'} - ${therapistProfile.supportMode} support`,
      matchScore: `${Math.min(score, 98)}%`,
      tags: [
        patientProfile.mainGoal.includes('hand') ? 'Hand Function' : 'Stroke Upper Limb',
        patientProfile.supportMode,
        patientProfile.affectedSide === 'Both/Unsure' ? 'Bilateral Review' : `${patientProfile.affectedSide} Side Focus`,
      ],
      experience: [
        `${therapistProfile.yearsExperience} rehabilitation experience with ${therapistProfile.strokeExperience} stroke rehab focus.`,
        `Experienced with ${therapistProfile.assessments.join(', ')} for upper-limb function review.`,
        `Matched to your goal: ${patientProfile.mainGoal}.`,
      ],
      focus: ['Limited active shoulder elevation', 'Scapular and trunk compensation', 'Wrist extension and grasp-release control'],
    };
  }, [patientProfile, therapistProfile]);
  const activePatientTab = useMemo<PatientTab>(() => {
    if (screen === 'assessment' || screen === 'collect' || screen === 'analysisLoading' || screen === 'metrics' || screen === 'problems') return 'assessment';
    if (screen === 'planLoading' || screen === 'plan' || screen === 'demo' || screen === 'patientTraining') return 'training';
    if (screen === 'match' || screen === 'profile' || screen === 'waiting' || screen === 'patientCare') return 'care';
    if (screen === 'patientMe') return 'me';
    return 'home';
  }, [screen]);
  const showPatientTabs =
    accountSession?.role === 'patient'
    && !['welcome', 'auth', 'patientOnboarding', 'therapistOnboarding', 'therapistDashboard', 'analysisLoading', 'planLoading', 'demo'].includes(screen);

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
      setScreen(analysisResult ? 'plan' : 'patientTraining');
      return;
    }
    if (tab === 'care') {
      setScreen(matchId ? 'waiting' : 'patientCare');
      return;
    }
    setScreen('patientMe');
  };

  const requireCredentials = (credentials: AuthCredentials) => {
    if (!credentials.identifier.trim() || credentials.password.length < 4) {
      Alert.alert('Account Required', 'Please enter an email or phone and a password with at least 4 characters.');
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
        } else {
          setPatientOnboardingBackScreen('auth');
          setScreen('patientOnboarding');
        }
        return;
      }
      if (session.profile) {
        setTherapistProfile(session.profile as TherapistProfile);
        setScreen('therapistDashboard');
      } else {
        setScreen('therapistOnboarding');
      }
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Could not log in. Please check the backend and try again.');
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
      Alert.alert('Account Creation Failed', error instanceof Error ? error.message : 'Could not create this account.');
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
        Alert.alert('Profile Save Failed', error instanceof Error ? error.message : 'The profile could not be saved to the database.');
        return;
      }
    }
    setScreen('home');
  };

  const logoutPatient = () => {
    setAccountSession(null);
    setScreen('welcome');
  };

  const completeTherapistOnboarding = async (profile: TherapistProfile) => {
    setTherapistProfile(profile);
    if (accountSession?.role === 'therapist') {
      try {
        await saveRehabProfile('therapist', accountSession.userId, profile);
      } catch (error) {
        Alert.alert('Profile Save Failed', error instanceof Error ? error.message : 'The therapist profile could not be saved to the database.');
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
      Alert.alert('Coming Soon', `${pkg.title} will be connected later. This demo currently opens the Upper Limb Package.`);
      return;
    }
    setSelectedPackage(pkg.key);
    setScreen('collect');
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission Required', 'Please allow camera access before collecting movement videos.');
        return;
      }
    }
    setCameraOpen(true);
  };

  const runQualityCheck = async (action: CollectionAction, actionIndex: number, uri: string) => {
    setQualityCheckingActionId(action.id);
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
        setTimeout(() => {
          if (actionIndex < upperActions.length - 1) {
            setCurrentActionIndex(actionIndex + 1);
          } else {
            Alert.alert('Collection Complete', 'All upper-limb movements passed quality check. You can generate your rehab plan.');
          }
        }, 650);
        return;
      }
      setQualityPassed((prev) => ({ ...prev, [action.id]: false }));
      Alert.alert('Please Retake This Video', `${result.patientMessage}\n\n${result.tips.join('\n')}`);
    } catch (error) {
      const fallback: VideoQualityResult = {
        actionId: action.id,
        passed: false,
        status: 'fail',
        score: 0,
        patientMessage: 'The video quality check could not be completed.',
        issues: [error instanceof Error ? error.message : 'Quality check failed.'],
        tips: ['Check your network connection, keep the full upper body in frame, and record again.'],
      };
      setQualityResults((prev) => ({ ...prev, [action.id]: fallback }));
      setQualityPassed((prev) => ({ ...prev, [action.id]: false }));
      Alert.alert('Quality Check Failed', fallback.tips.join('\n'));
    } finally {
      setQualityCheckingActionId(null);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    setRecording(true);
    const action = currentAction;
    const actionIndex = currentActionIndex;
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 12 });
      if (video?.uri) {
        setRecordedVideos((prev) => ({ ...prev, [action.id]: video.uri }));
        setRecording(false);
        await runQualityCheck(action, actionIndex, video.uri);
      }
    } catch {
      Alert.alert('Recording Failed', 'Please reopen the camera and record again.');
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
  };

  const generatePlan = async () => {
    if (!canGeneratePlan) {
      Alert.alert('Not Ready Yet', 'Please complete all upper-limb recordings and video quality checks first.');
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
        Alert.alert(
          'Analysis Saved Locally Only',
          saveError instanceof Error ? saveError.message : 'The analysis ran, but the database save failed.',
        );
      }
      setAnalysisReady(true);
      await playCompletionDing();
    } catch {
      setAnalysisReady(false);
      setScreen('collect');
      Alert.alert(
        'Analysis Failed',
        'The backend could not analyze these videos. Please make sure the AxonAI API is running and your phone can reach EXPO_PUBLIC_AXONAI_API_URL.',
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
      Alert.alert('Match Save Failed', error instanceof Error ? error.message : 'The match request could not be saved.');
    }
  };

  const startTherapistMatch = async () => {
    try {
      const therapists = await requestAvailableTherapists();
      if (!therapists.length) {
        Alert.alert('No Therapist Available', 'There are no verified therapist profiles in the AxonAI database yet.');
        return;
      }
      setTherapistProfile(therapists[0].profile);
      setScreen('match');
    } catch (error) {
      Alert.alert('Therapist Search Failed', error instanceof Error ? error.message : 'Could not check therapist availability.');
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
            busy={authBusy}
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
            completedCount={completedCount}
            onStartAssessment={() => setScreen('assessment')}
            onOpenPlan={() => setScreen(analysisResult ? 'plan' : 'patientTraining')}
            onOpenCare={() => setScreen(matchId ? 'waiting' : 'patientCare')}
          />
        )}
        {screen === 'assessment' && <AssessmentScreen onOpenPackage={openPackage} />}
        {screen === 'patientTraining' && (
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
        {screen === 'patientMe' && (
          <PatientMeScreen
            profile={patientProfile}
            account={accountSession}
            onEditProfile={() => {
              setPatientOnboardingBackScreen('patientMe');
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
            isCameraOpen={isCameraOpen}
            isRecording={isRecording}
            cameraRef={cameraRef}
            canGeneratePlan={canGeneratePlan}
            onBack={() => setScreen('home')}
            onOpenCamera={openCamera}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onRetryAction={retryAction}
            onSelectAction={setCurrentActionIndex}
            onGeneratePlan={generatePlan}
          />
        )}
        {screen === 'analysisLoading' && (
          <AnalysisLoadingScreen
            isComplete={analysisReady}
            onBack={() => setScreen('collect')}
            onComplete={() => setScreen('metrics')}
            lead="Please wait while AxonAI reviews your movement videos. Video upload and pose analysis can take one to two minutes on the cloud server."
            statuses={['Checking movement videos', 'Extracting key movement metrics', 'Building your functional summary']}
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
            onMatch={startTherapistMatch}
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
        {screen === 'match' && <MatchScreen onBack={() => setScreen('plan')} onMatched={() => setScreen('profile')} />}
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
            <Text style={styles.brandTitle}>AxonAI Rehab</Text>
            <Text style={styles.brandSubtitle}>Guided recovery workflow</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Start with the right role, then build a safer rehab plan</Text>
      </View>

      <Text style={styles.sectionLabel}>Choose Your Account Type</Text>
      <View style={styles.roleGrid}>
        <Pressable style={tapStyle(styles.roleCard)} onPress={() => onSelectRole('patient')}>
          <View style={styles.roleIcon}>
            <Ionicons name="person" size={30} color="#ffffff" />
          </View>
          <View style={styles.roleCopy}>
            <Text style={styles.roleTitle}>I am a Patient</Text>
            <Text style={styles.roleText}>Collect movements, view functional problems, and follow a weekly training plan.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#1267e6" />
        </Pressable>

        <Pressable style={tapStyle(styles.roleCard)} onPress={() => onSelectRole('therapist')}>
          <View style={[styles.roleIcon, styles.roleIconTeal]}>
            <Ionicons name="medical" size={30} color="#031629" />
          </View>
          <View style={styles.roleCopy}>
            <Text style={styles.roleTitle}>I am a Therapist</Text>
            <Text style={styles.roleText}>Create a professional profile for matching and patient plan review.</Text>
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
  const roleLabel = role === 'patient' ? 'Patient' : 'Therapist';
  const credentials = { identifier, password };
  return (
    <View style={styles.lightScreen}>
      <Header title={`${roleLabel} Account`} subtitle="Login or create a prototype account" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.authCard}>
          <View style={styles.authIcon}>
            <Ionicons name={role === 'patient' ? 'person-circle' : 'medkit'} size={44} color="#1267e6" />
          </View>
          <Text style={styles.authTitle}>{roleLabel} Login</Text>
          <Text style={styles.authText}>Create or log in to save your profile, analysis results, and matching requests to the AxonAI database.</Text>
          <FormField label="Email or phone" value={identifier} onChangeText={setIdentifier} placeholder="demo@axonai.app" />
          <FormField label="Password" value={password} onChangeText={setPassword} placeholder="At least 4 characters" secureTextEntry />
          <PrimaryLightButton
            label={busy ? 'Connecting...' : `Login as ${roleLabel}`}
            icon="log-in"
            onPress={() => onLogin(credentials)}
            disabled={busy}
            loading={busy}
          />
          {busy && <Text style={styles.authStatusText}>Connecting to the secure AxonAI backend...</Text>}
        </View>

        <Pressable
          disabled={busy}
          style={({ pressed }) => [styles.createAccountCard, pressed && styles.tapFeedback, busy && styles.disabledButton]}
          onPress={() => onCreate(credentials)}
        >
          <Ionicons name="add-circle" size={24} color="#1267e6" />
          <View style={styles.createAccountCopy}>
            <Text style={styles.createAccountTitle}>{busy ? 'Creating Account...' : `Create New ${roleLabel} Account`}</Text>
            <Text style={styles.createAccountText}>
              {busy ? 'Please wait. This can take a moment if the cloud service is waking up.' : 'Fill out the basic profile needed for rehab planning and matching.'}
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
      <Header title="Patient Profile" subtitle="Information used for safer planning and therapist matching" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Basic Information</Text>
          <FormField label="Full name" value={profile.fullName} onChangeText={(value) => setField('fullName', value)} placeholder="Your name" />
          <FormField label="Language" value={profile.language} onChangeText={(value) => setField('language', value)} placeholder="English" />
          <FormField label="City or time zone" value={profile.location} onChangeText={(value) => setField('location', value)} placeholder="London / GMT" />
          <Text style={styles.formLabel}>Age range</Text>
          <OptionChips options={patientOptionSets.ageRange} value={profile.ageRange} onChange={(value) => setField('ageRange', value)} />
          <Text style={styles.formLabel}>Gender</Text>
          <OptionChips options={patientOptionSets.gender} value={profile.gender} onChange={(value) => setField('gender', value)} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Stroke And Rehab Profile</Text>
          <Text style={styles.formLabel}>Stroke type</Text>
          <OptionChips options={patientOptionSets.strokeType} value={profile.strokeType} onChange={(value) => setField('strokeType', value)} />
          <Text style={styles.formLabel}>Time since stroke</Text>
          <OptionChips options={patientOptionSets.onsetTime} value={profile.onsetTime} onChange={(value) => setField('onsetTime', value)} />
          <Text style={styles.formLabel}>Affected side</Text>
          <OptionChips options={patientOptionSets.affectedSide} value={profile.affectedSide} onChange={(value) => setField('affectedSide', value)} />
          <Text style={styles.formLabel}>Dominant hand before stroke</Text>
          <OptionChips options={patientOptionSets.dominantHand} value={profile.dominantHand} onChange={(value) => setField('dominantHand', value)} />
          <Text style={styles.formLabel}>Mobility level</Text>
          <OptionChips options={patientOptionSets.mobilityLevel} value={profile.mobilityLevel} onChange={(value) => setField('mobilityLevel', value)} />
          <FormField label="Current upper-limb ability" value={profile.upperLimbAbility} onChangeText={(value) => setField('upperLimbAbility', value)} placeholder="What can your arm/hand do now?" />
          <FormField label="Main rehab goal" value={profile.mainGoal} onChangeText={(value) => setField('mainGoal', value)} placeholder="Eating, dressing, reaching, hand use..." />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Safety And Matching</Text>
          <Text style={styles.formLabel}>Safety flags</Text>
          <ToggleChips
            options={['Shoulder pain', 'Severe spasticity', 'Recent fall', 'Recent surgery/fracture', 'Medical instability']}
            values={profile.safetyFlags}
            onToggle={toggleSafety}
          />
          <Text style={styles.formLabel}>Preferred support</Text>
          <OptionChips options={patientOptionSets.supportMode} value={profile.supportMode} onChange={(value) => setField('supportMode', value)} />
          <View style={styles.consentNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#1267e6" />
            <Text style={styles.consentText}>Prototype notice: this profile stays in local app state. A production version needs consent, privacy policy, and secure storage before real patient use.</Text>
          </View>
        </View>

        <PrimaryLightButton label="Continue to Functional Packages" icon="arrow-forward" onPress={() => onComplete(profile)} />
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
      <Header title="Therapist Profile" subtitle="Information used for responsible patient matching" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Professional Identity</Text>
          <FormField label="Full name" value={profile.fullName} onChangeText={(value) => setField('fullName', value)} placeholder="Your name" />
          <FormField label="Professional title" value={profile.title} onChangeText={(value) => setField('title', value)} placeholder="Neurological Rehabilitation Therapist" />
          <Text style={styles.formLabel}>Profession</Text>
          <OptionChips options={therapistOptionSets.profession} value={profile.profession} onChange={(value) => setField('profession', value)} />
          <FormField label="City or time zone" value={profile.location} onChangeText={(value) => setField('location', value)} placeholder="London / GMT" />
          <FormField label="Languages" value={profile.languages} onChangeText={(value) => setField('languages', value)} placeholder="English, Mandarin" />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Clinical Experience</Text>
          <Text style={styles.formLabel}>Years of rehab experience</Text>
          <OptionChips options={therapistOptionSets.yearsExperience} value={profile.yearsExperience} onChange={(value) => setField('yearsExperience', value)} />
          <Text style={styles.formLabel}>Stroke rehab experience</Text>
          <OptionChips options={therapistOptionSets.strokeExperience} value={profile.strokeExperience} onChange={(value) => setField('strokeExperience', value)} />
          <Text style={styles.formLabel}>Specialties</Text>
          <ToggleChips
            options={['Upper-limb rehab', 'Hand function', 'Gait', 'Balance', 'Home exercise programs', 'Tele-rehab']}
            values={profile.specialties}
            onToggle={(value) => toggleList('specialties', value)}
          />
          <Text style={styles.formLabel}>Assessments used</Text>
          <ToggleChips
            options={['Fugl-Meyer UE', 'ARAT', 'WMFT', 'Box and Block', 'Nine-Hole Peg Test', 'Modified Ashworth']}
            values={profile.assessments}
            onToggle={(value) => toggleList('assessments', value)}
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Service Preferences</Text>
          <Text style={styles.formLabel}>Support mode</Text>
          <OptionChips options={therapistOptionSets.supportMode} value={profile.supportMode} onChange={(value) => setField('supportMode', value)} />
          <FormField label="Availability" value={profile.availability} onChangeText={(value) => setField('availability', value)} placeholder="Weekdays, evenings, weekends..." />
          <View style={styles.consentNotice}>
            <Ionicons name="ribbon" size={20} color="#1267e6" />
            <Text style={styles.consentText}>Before production matching, professional verification and clinical governance review are required.</Text>
          </View>
        </View>

        <PrimaryLightButton label="Create Therapist Profile" icon="checkmark-circle" onPress={() => onComplete(profile)} />
      </ScrollView>
    </View>
  );
}

function TherapistDashboardScreen({ profile, onBack }: { profile: TherapistProfile; onBack: () => void }) {
  return (
    <View style={styles.lightScreen}>
      <Header title="Therapist Workspace" subtitle="Prototype matching profile is ready" onBack={onBack} darkText />
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
          <Text style={styles.formSectionTitle}>Matching Profile</Text>
          <InfoRow label="Profession" value={profile.profession} />
          <InfoRow label="Stroke experience" value={profile.strokeExperience} />
          <InfoRow label="Languages" value={profile.languages} />
          <InfoRow label="Availability" value={profile.availability} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Clinical Focus</Text>
          <View style={styles.tagWrap}>
            {profile.specialties.map((item) => (
              <Text key={item} style={styles.profileTag}>{item}</Text>
            ))}
          </View>
          <Text style={styles.formSectionTitle}>Assessments</Text>
          <View style={styles.tagWrap}>
            {profile.assessments.map((item) => (
              <Text key={item} style={styles.profileTagMuted}>{item}</Text>
            ))}
          </View>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="time" size={22} color="#1267e6" />
          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>Verification Pending</Text>
            <Text style={styles.tipText}>Production matching should verify license, identity, scope of practice, and clinical governance before real patient referrals.</Text>
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
  completedCount,
  onStartAssessment,
  onOpenPlan,
  onOpenCare,
}: {
  patientProfile: PatientProfile;
  analysisResult: UpperLimbAnalysisResult | null;
  completedCount: number;
  onStartAssessment: () => void;
  onOpenPlan: () => void;
  onOpenCare: () => void;
}) {
  const topProblem = analysisResult?.functionalProblems[0]?.title ?? 'No functional problem generated yet';
  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Ionicons name="pulse" size={23} color="#071b33" />
          </View>
          <View>
            <Text style={styles.brandTitle}>AxonAI Rehab Assistant</Text>
            <Text style={styles.brandSubtitle}>Stroke assessment and training plan</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Welcome back, {patientProfile.fullName || 'Patient'}</Text>
        <Text style={styles.heroBody}>Today starts with a clear plan: assess movement, follow safe training, and ask for support when needed.</Text>
      </View>

      <View style={styles.todayPanel}>
        <View style={styles.todayHeader}>
          <Text style={styles.todayLabel}>Today</Text>
          <Text style={styles.todayStatus}>{analysisResult ? 'Plan ready' : 'Assessment needed'}</Text>
        </View>
        <Text style={styles.todayTitle}>{analysisResult ? 'Continue your upper-limb training' : 'Start with movement collection'}</Text>
        <Text style={styles.todayText}>
          {analysisResult
            ? `Main priority: ${topProblem}. Complete today's exercises and review demonstrations before training.`
            : `Complete the Upper Limb Package first. ${completedCount}/9 recordings have passed video quality checks.`}
        </Text>
        <PrimaryLightButton
          label={analysisResult ? 'View Today\'s Training' : 'Start Assessment'}
          icon={analysisResult ? 'calendar' : 'videocam'}
          onPress={analysisResult ? onOpenPlan : onStartAssessment}
        />
      </View>

      <View style={styles.homeActionGrid}>
        <Pressable style={tapStyle(styles.homeActionCard)} onPress={onStartAssessment}>
          <Ionicons name="body" size={24} color="#1267e6" />
          <Text style={styles.homeActionTitle}>Assessment</Text>
          <Text style={styles.homeActionText}>Record or refresh movement packages.</Text>
        </Pressable>
        <Pressable style={tapStyle(styles.homeActionCard)} onPress={onOpenCare}>
          <Ionicons name="people" size={24} color="#0b756d" />
          <Text style={styles.homeActionTitle}>Care Team</Text>
          <Text style={styles.homeActionText}>Match a therapist and support network.</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Learn and Support</Text>
      <View style={styles.educationList}>
        <View style={styles.educationCard}>
          <Ionicons name="book" size={23} color="#1267e6" />
          <View style={styles.educationCopy}>
            <Text style={styles.educationTitle}>Stroke recovery basics</Text>
            <Text style={styles.educationText}>Short lessons about safe repetition, fatigue, pain warning signs, and why daily practice matters.</Text>
          </View>
        </View>
        <View style={styles.educationCard}>
          <Ionicons name="chatbubbles" size={23} color="#0b756d" />
          <View style={styles.educationCopy}>
            <Text style={styles.educationTitle}>Family and peer support</Text>
            <Text style={styles.educationText}>A moderated stroke community is planned so families can share routines without unsafe medical advice.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function AssessmentScreen({ onOpenPackage }: { onOpenPackage: (pkg: RehabPackage) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCompact}>
        <Text style={styles.heroKicker}>Assessment</Text>
        <Text style={styles.heroTitleCompact}>Choose a functional package</Text>
        <Text style={styles.heroBody}>Collect guided videos first. AxonAI checks video quality before analysis and training-plan generation.</Text>
      </View>
      <Text style={styles.sectionLabel}>Select a Functional Package</Text>
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
            <Text style={[styles.packageStatus, pkg.active && styles.packageStatusActive]}>{pkg.active ? 'Start' : 'Soon'}</Text>
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
          <Text style={styles.tabHeroTitle}>Training</Text>
          <Text style={styles.tabHeroText}>
            {hasPlan
              ? 'Your weekly training plan is ready. Open it to see today\'s exercises and demonstrations.'
              : 'Training appears after movement collection and analysis, so exercises match your functional priorities.'}
          </Text>
          <PrimaryLightButton label={hasPlan ? 'Open Weekly Plan' : 'Start Assessment First'} icon={hasPlan ? 'calendar' : 'videocam'} onPress={hasPlan ? onOpenPlan : onStartAssessment} />
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>What will appear here</Text>
          <InfoRow label="Daily exercises" value="Dose, sets, reps" />
          <InfoRow label="Demonstrations" value="Video guidance" />
          <InfoRow label="Feedback" value="Pain, fatigue, completion" />
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
          <Text style={styles.tabHeroTitle}>Care Team</Text>
          <Text style={styles.tabHeroText}>
            {matchId ? 'Your therapist request has been sent. You can review the matched profile while waiting for a response.' : 'Match a therapist and home-support network after your training plan is generated.'}
          </Text>
          <PrimaryLightButton label={matchId ? 'View Matched Therapist' : 'Match AXONAI Therapist'} icon={matchId ? 'person-circle' : 'search'} onPress={matchId ? onOpenProfile : onStartMatch} />
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Suggested Match</Text>
          <InfoRow label="Therapist" value={person.name} />
          <InfoRow label="Specialty" value={person.tags[0]} />
          <InfoRow label="Fit" value={person.matchScore} />
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
            <Text style={styles.therapistName}>{profile.fullName || 'Patient'}</Text>
            <Text style={styles.therapistTitle}>{account?.identifier ?? 'No account identifier'}</Text>
            <Text style={styles.therapistMeta}>{profile.location} - {profile.supportMode}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Rehab Profile</Text>
          <InfoRow label="Affected side" value={profile.affectedSide} />
          <InfoRow label="Stroke onset" value={profile.onsetTime} />
          <InfoRow label="Main goal" value={profile.mainGoal} />
          <InfoRow label="Safety flags" value={profile.safetyFlags.length ? profile.safetyFlags.join(', ') : 'None recorded'} />
        </View>

        <PrimaryLightButton label="Edit Patient Profile" icon="create" onPress={onEditProfile} />
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
  isCameraOpen,
  isRecording,
  cameraRef,
  canGeneratePlan,
  onBack,
  onOpenCamera,
  onStartRecording,
  onStopRecording,
  onRetryAction,
  onSelectAction,
  onGeneratePlan,
}: {
  currentAction: CollectionAction;
  currentActionIndex: number;
  completedCount: number;
  recordedVideos: Record<string, string>;
  qualityPassed: Record<string, boolean>;
  qualityResults: Record<string, VideoQualityResult>;
  qualityCheckingActionId: string | null;
  isCameraOpen: boolean;
  isRecording: boolean;
  cameraRef: React.MutableRefObject<CameraView | null>;
  canGeneratePlan: boolean;
  onBack: () => void;
  onOpenCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetryAction: () => void;
  onSelectAction: (index: number) => void;
  onGeneratePlan: () => void;
}) {
  const currentQuality = qualityResults[currentAction.id];
  const isCheckingQuality = qualityCheckingActionId === currentAction.id;
  const qualityPassedCurrent = qualityPassed[currentAction.id];
  const openCollectionGuide = () => {
    Alert.alert(`${currentAction.cameraView} Guide`, `${currentAction.viewInstruction}\n\n${currentAction.guideScript}`);
  };

  return (
    <View style={styles.screen}>
      <Header title="Upper Limb Collection" subtitle={`${completedCount}/${upperActions.length} movements passed quality check`} onBack={onBack} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.progressPanel}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedCount / upperActions.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Complete all recordings before generating a personalized rehab plan.</Text>
        </View>

        <View style={styles.actionStepper}>
          {upperActions.map((action, index) => {
            const selected = index === currentActionIndex;
            const done = qualityPassed[action.id];
            return (
              <Pressable
                key={action.id}
                style={({ pressed }) => [styles.stepPill, selected && styles.stepPillActive, pressed && styles.tapFeedback]}
                onPress={() => onSelectAction(index)}
              >
                <Text style={[styles.stepNumber, done && styles.stepDone]}>{done ? 'ok' : index + 1}</Text>
                <Text style={[styles.stepTitle, selected && styles.stepTitleActive]} numberOfLines={1}>
                  {action.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.currentActionCard}>
          <Text style={styles.actionKicker}>Movement {currentActionIndex + 1} / {upperActions.length}</Text>
          <Text style={styles.currentActionTitle}>{currentAction.title}</Text>
          <Text style={styles.currentActionTarget}>{currentAction.target}</Text>
          <View style={styles.instructionBox}>
            <Ionicons name="mic" size={17} color="#01d4c0" />
            <Text style={styles.instructionText}>{currentAction.instruction}</Text>
          </View>
          <Pressable style={tapStyle(styles.collectionGuideButton)} onPress={openCollectionGuide}>
            <Ionicons name="information-circle" size={20} color="#ffffff" />
            <View style={styles.collectionGuideCopy}>
              <Text style={styles.collectionGuideTitle}>View Recording Guide</Text>
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
              <Text style={styles.cameraEmptyTitle}>Open the camera to start</Text>
              <Text style={styles.cameraEmptyText}>Keep the upper body and affected arm fully visible with good lighting.</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="scan" size={14} color="#ffffff" />
            <Text style={styles.cameraBadgeText}>{currentAction.cameraView}, about 1.5 m away</Text>
          </View>
          {(isCheckingQuality || qualityPassedCurrent || currentQuality) && (
            <View style={[styles.cameraQualityOverlay, qualityPassedCurrent && styles.cameraQualityOverlayPass, currentQuality && !qualityPassedCurrent && !isCheckingQuality && styles.cameraQualityOverlayFail]}>
              {isCheckingQuality ? <ActivityIndicator color="#ffffff" /> : <Ionicons name={qualityPassedCurrent ? 'checkmark-circle' : 'alert-circle'} size={38} color="#ffffff" />}
              <Text style={styles.cameraQualityOverlayText}>{isCheckingQuality ? 'Checking video quality...' : qualityPassedCurrent ? 'Video passed' : 'Please retake'}</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          {!isCameraOpen && <PrimaryButton label="Open Camera" icon="camera" onPress={onOpenCamera} />}
          {isCameraOpen && !isRecording && !isCheckingQuality && <PrimaryButton label="Start Recording" icon="radio-button-on" onPress={onStartRecording} />}
          {isRecording && <DangerButton label="Stop and Save" icon="stop-circle" onPress={onStopRecording} />}
          <SecondaryButton label="Retake" icon="refresh" onPress={onRetryAction} />
        </View>

        <View style={styles.qualityCard}>
          <View style={styles.qualityCopy}>
            <View style={styles.qualityTitleRow}>
              <Ionicons
                name={isCheckingQuality ? 'sync' : qualityPassedCurrent ? 'checkmark-circle' : currentQuality ? 'warning' : 'videocam'}
                size={19}
                color={isCheckingQuality ? '#05e1d2' : qualityPassedCurrent ? '#18c37e' : currentQuality ? '#ffb020' : '#a9bed7'}
              />
              <Text style={styles.qualityTitle}>
                {isCheckingQuality ? 'Checking Video Quality' : qualityPassedCurrent ? 'Video Quality Passed' : currentQuality ? 'Please Retake This Video' : 'Video Quality Check'}
              </Text>
            </View>
            <Text style={styles.qualityText}>
              {isCheckingQuality
                ? 'Please wait while AxonAI checks lighting, stability, video length, and whether your arm keypoints are visible.'
                : qualityPassedCurrent
                  ? 'Good recording. Moving to the next movement automatically.'
                  : currentQuality
                    ? currentQuality.patientMessage
                    : recordedVideos[currentAction.id]
                      ? 'Video saved. Waiting for quality check result.'
                      : 'After you stop recording, AxonAI will automatically check this video before you continue.'}
            </Text>
            {currentQuality && !currentQuality.passed && (
              <View style={styles.qualityTips}>
                {currentQuality.tips.slice(0, 3).map((tip) => (
                  <View key={tip} style={styles.qualityTipRow}>
                    <Ionicons name="arrow-forward-circle" size={15} color="#ffcf66" />
                    <Text style={styles.qualityTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          {isCheckingQuality && (
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityBadgeText}>Checking</Text>
            </View>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.generateButton, !canGeneratePlan && styles.generateButtonDisabled, pressed && styles.tapFeedbackStrong]}
          onPress={onGeneratePlan}
        >
          <Text style={styles.generateButtonText}>Generate Personalized Rehab Plan</Text>
          <Ionicons name="arrow-forward" size={20} color="#031629" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function AnalysisLoadingScreen({
  isComplete,
  onBack,
  onComplete,
  title = 'Generating My Rehab Plan',
  subtitle = 'Analyzing movement performance and training priorities',
  headline = 'Smart Analysis Running',
  lead = 'Organizing movement quality, functional problems, and training priorities to build a clearer rehab plan.',
  statuses = ['Analyzing movement performance', 'Organizing functional problems', 'Matching training priorities'],
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
      <Header title="Building Weekly Training Plan" subtitle="Preparing your daily rehab tasks" onBack={onBack} />
      <View style={styles.weeklyLoadingContent}>
        <Animated.View style={[styles.weeklyLoadingIcon, { transform: [{ scale: pulseScale }] }]}>
          <Ionicons name="calendar-clear" size={42} color="#05e1d2" />
          <View style={styles.weeklyLoadingDot} />
        </Animated.View>

        <Text style={styles.weeklyLoadingTitle}>Creating Your Weekly Plan</Text>
        <Text style={styles.weeklyLoadingText}>Selecting the right exercises, daily dose, and demo sequence for your training week.</Text>

        <View style={styles.weeklyProgressTrack}>
          <Animated.View style={[styles.weeklyProgressFill, { width: progressWidth }]}>
            <Animated.View style={[styles.weeklyProgressShimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
          </Animated.View>
        </View>

        <View style={styles.weeklyStepCard}>
          {['Linking problems to exercises', 'Setting daily training dose', 'Loading exercise demonstrations'].map((step, index) => (
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
      <Header title="Movement Metrics" subtitle="A simple view of your upper-limb performance" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsHero}>
          <Text style={styles.metricsHeroTitle}>What we saw from your videos</Text>
          <Text style={styles.metricsHeroText}>These are screening estimates from phone video, designed to help you understand movement priorities before seeing the full plan.</Text>
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
        <PrimaryLightButton label="View My Functional Problems" icon="analytics" onPress={onContinue} />
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
      label: 'Arm lifting range',
      value: `${Math.round(shoulderFlexion)}°`,
      percent: Math.max(8, Math.min(100, Math.round((shoulderFlexion / 120) * 100))),
      hint: 'Shows how far the arm can lift during the upper-limb task.',
      color: '#1267e6',
      icon: 'arrow-up-circle' as keyof typeof Ionicons.glyphMap,
    },
    {
      label: 'Forward reach ability',
      value: `${Math.round(Math.min(reach, 1) * 100)}%`,
      percent: Math.max(8, Math.min(100, Math.round(Math.min(reach, 1) * 100))),
      hint: 'Shows how well the hand can move forward toward a target.',
      color: '#0b756d',
      icon: 'navigate-circle' as keyof typeof Ionicons.glyphMap,
    },
    {
      label: 'Wrist lifting control',
      value: `${Math.round(wrist)}°`,
      percent: Math.max(8, Math.min(100, Math.round((wrist / 60) * 100))),
      hint: 'Important for hand opening, grasp, and object release.',
      color: '#ff9f0a',
      icon: 'hand-left' as keyof typeof Ionicons.glyphMap,
    },
    {
      label: 'Movement smoothness',
      value: `${Math.round(smoothness * 100)}%`,
      percent: Math.max(8, Math.min(100, Math.round(smoothness * 100))),
      hint: 'Lower smoothness may mean the body is compensating or control is inconsistent.',
      color: '#8b5cf6',
      icon: 'pulse' as keyof typeof Ionicons.glyphMap,
    },
  ];
}

function ProblemsScreen({
  analysisResult,
  onBack,
  onPlan,
  onMatch,
  onDemo,
}: {
  analysisResult: UpperLimbAnalysisResult | null;
  onBack: () => void;
  onPlan: () => void;
  onMatch: () => void;
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
      <Header title="My Functional Problems" subtitle={analysisResult ? `Algorithm ${analysisResult.algorithmVersion}` : 'Upper Limb Package summary'} onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        {displayProblems.map((problem, index) => (
          <View key={problem.title} style={styles.problemCard}>
            <View style={styles.problemIndex}>
              <Text style={styles.problemIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.problemIllustration}>
              <Ionicons name={iconForProblem(problem.id)} size={44} color="#1267e6" />
            </View>
            <View style={styles.problemCopy}>
              <Text style={styles.problemArea}>{problem.severity.toUpperCase()}</Text>
              <Text style={styles.problemTitle}>{problem.title}</Text>
              <Text style={styles.problemSummary}>{problem.patient_summary}</Text>
            </View>
          </View>
        ))}

        <PrimaryLightButton label="View Weekly Training Plan" icon="calendar" onPress={onPlan} />
        <MatchButton onPress={onMatch} />
        <Pressable style={tapStyle(styles.inlineDemoButton)} onPress={() => onDemo(exercises[0])}>
          <Ionicons name="play-circle" size={20} color="#1267e6" />
          <Text style={styles.inlineDemoText}>Preview an Exercise Demo</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function PlanScreen({
  analysisResult,
  selectedDay,
  dayExercises,
  onSelectDay,
  onBack,
  onMatch,
  onDemo,
}: {
  analysisResult: UpperLimbAnalysisResult | null;
  selectedDay: number;
  dayExercises: Exercise[];
  onSelectDay: (day: number) => void;
  onBack: () => void;
  onMatch: () => void;
  onDemo: (exercise: Exercise) => void;
}) {
  return (
    <View style={styles.lightScreen}>
      <Header title="Personalized Training Plan" subtitle="Complete today's tasks each day" onBack={onBack} darkText />
      <ScrollView contentContainerStyle={styles.lightContent} showsVerticalScrollIndicator={false}>
        <View style={styles.weekPanel}>
          <View>
            <Text style={styles.weekTitle}>This Week's Progress</Text>
            <Text style={styles.weekDate}>{analysisResult ? `Generated by ${analysisResult.algorithmVersion}` : 'Week 1 - Demo Training Plan'}</Text>
          </View>
          <Text style={styles.weekCount}>{analysisResult?.weeklyExercisePlan.length ?? 4}/21 items</Text>
        </View>
        <View style={styles.dayRow}>
          {weekDays.map((day, index) => {
            const value = index + 1;
            const selected = selectedDay === value;
            return (
              <Pressable key={day} style={tapStyle(styles.dayItem)} onPress={() => onSelectDay(value)}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={[styles.dayDot, selected && styles.dayDotActive]}>
                  <Text style={styles.dayDotText}>{selected ? 'Today' : index < 3 ? 'ok' : ''}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

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
            <View style={styles.exerciseStatus}>
              <Text style={styles.exerciseStatusText}>Demo</Text>
              <Ionicons name="chevron-forward" size={17} color="#1267e6" />
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
        <Text style={styles.axonMatchTitle}>Match AXONAI Therapist</Text>
        <Text style={styles.axonMatchText}>Searches the therapist and support network together</Text>
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
      <Header title="Match AXONAI Therapist" subtitle="Searching the therapist and support network" onBack={onBack} />
      <View style={styles.matchContent}>
        <View style={styles.networkCanvas}>
          <Animated.View style={[styles.networkRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
          <View style={styles.networkCore}>
            <Ionicons name="pulse" size={42} color="#05e1d2" />
            <Text style={styles.networkCoreText}>AxonAI</Text>
          </View>
          <NetworkNode label="Therapist" top={30} left={24} delay={0} />
          <NetworkNode label="Care Aide" top={78} right={18} delay={160} />
          <NetworkNode label="Companion" bottom={88} left={16} delay={320} />
          <NetworkNode label="Technician" bottom={44} right={28} delay={480} />
        </View>
        <View style={styles.candidateCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{supportNames[candidateIndex].slice(0, 1)}</Text>
          </View>
          <View style={styles.candidateCopy}>
            <Text style={styles.matchingLabel}>Matching</Text>
            <Text style={styles.candidateName}>{supportNames[candidateIndex]}</Text>
            <Text style={styles.candidateTitle}>Reviewing fit with your training goals</Text>
          </View>
        </View>
        <Text style={styles.matchHint}>The result page will show the matched therapist profile for patient confirmation.</Text>
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
      <Header title="AXONAI Therapist Matched" subtitle="A suitable therapist has been matched for you" onBack={onBack} darkText />
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
              <Text style={styles.matchScoreLabel}>Match</Text>
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
          <Text style={styles.profileSectionTitle}>Therapist Experience</Text>
          {person.experience.map((item) => (
            <View key={item} style={styles.profileRow}>
              <Ionicons name="checkmark-circle" size={18} color="#1267e6" />
              <Text style={styles.profileRowText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>Focus Areas</Text>
          {person.focus.map((item) => (
            <View key={item} style={styles.focusPill}>
              <Ionicons name="analytics" size={17} color="#0b756d" />
              <Text style={styles.focusPillText}>{item}</Text>
            </View>
          ))}
        </View>

        <Pressable style={tapStyle(styles.confirmTherapistButton)} onPress={onConfirm}>
          <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
          <Text style={styles.confirmTherapistText}>Confirm Therapist</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function WaitingScreen({ person, matchId, onBack }: { person: MatchedPerson; matchId: string | null; onBack: () => void }) {
  return (
    <View style={styles.waitingScreen}>
      <Header title="Waiting for Therapist Response" subtitle="Request sent. The therapist will contact you after confirmation." onBack={onBack} />
      <View style={styles.waitingContent}>
        <View style={styles.waitingIconWrap}>
          <Ionicons name="time" size={58} color="#05e1d2" />
        </View>
        <Text style={styles.waitingTitle}>Waiting for {person.name} to respond</Text>
        <Text style={styles.waitingText}>The therapist will review your functional problems and training plan. This is a demo flow; the formal version will include notifications, scheduling, and therapist-side confirmation.</Text>
        <View style={styles.waitingStatusCard}>
          <Ionicons name="send" size={20} color="#1267e6" />
          <Text style={styles.waitingStatusText}>{matchId ? `Match Request Sent: ${matchId.slice(0, 8)}` : 'Match Request Sent'}</Text>
        </View>
      </View>
    </View>
  );
}

const patientTabs: Array<{ key: PatientTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'assessment', label: 'Assessment', icon: 'body' },
  { key: 'training', label: 'Training', icon: 'fitness' },
  { key: 'care', label: 'Care Team', icon: 'people' },
  { key: 'me', label: 'Me', icon: 'person' },
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
      <Header title="Exercise Demo" subtitle={exercise.title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.demoContent} showsVerticalScrollIndicator={false}>
        <View style={styles.videoPanel}>
          {exercise.demoVideoUrl ? (
            <Video
              source={{ uri: exercise.demoVideoUrl }}
              style={styles.demoVideo}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={isPlaying}
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
              <Text style={styles.demoPlaceholderText}>HeyGen guided video will appear here after the media asset is connected.</Text>
              <View style={styles.videoProgress}>
                <View style={[styles.videoProgressFill, { width: isPlaying ? '56%' : '18%' }]} />
              </View>
            </LinearGradient>
          )}
        </View>
        <View style={styles.demoInfo}>
          <Text style={styles.demoSectionTitle}>Key Points</Text>
          {exercise.steps.map((step) => (
            <View key={step} style={styles.demoRow}>
              <Ionicons name="checkmark-circle" size={19} color="#0f6eff" />
              <Text style={styles.demoRowText}>{step}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Text style={styles.warningTitle}>Precautions</Text>
          {exercise.cautions.map((caution) => (
            <View key={caution} style={styles.demoRow}>
              <Ionicons name="warning" size={18} color="#ffb000" />
              <Text style={styles.demoRowText}>{caution}</Text>
            </View>
          ))}
          <Pressable style={tapStyle(styles.startTrainingButton)}>
            <Ionicons name="play" size={21} color="#ffffff" />
            <Text style={styles.startTrainingText}>Start Guided Practice</Text>
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
      <Text style={styles.primaryLightButtonText}>{label}</Text>
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
  problemCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 12, padding: 14, shadowColor: '#143664', shadowOpacity: 0.08, shadowRadius: 12 },
  analysisNoticeCard: { alignItems: 'flex-start', backgroundColor: '#e8f2ff', borderColor: '#cfe1f7', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 12, padding: 14 },
  analysisNoticeText: { color: '#26384d', flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  problemIndex: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  problemIndexText: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  problemIllustration: { alignItems: 'center', borderRadius: 16, height: 96, justifyContent: 'center', overflow: 'hidden', width: 88 },
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
  primaryLightButton: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 18, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 18, minHeight: 56 },
  primaryLightButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  axonMatchButton: { alignItems: 'center', backgroundColor: '#05e1d2', borderRadius: 18, flexDirection: 'row', gap: 11, justifyContent: 'center', marginTop: 14, minHeight: 68, paddingHorizontal: 15, paddingVertical: 12 },
  axonMatchIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.38)', borderRadius: 18, height: 42, justifyContent: 'center', width: 42 },
  axonMatchCopy: { flex: 1 },
  axonMatchTitle: { color: '#031629', fontSize: 17, fontWeight: '900' },
  axonMatchText: { color: '#064144', fontSize: 12, fontWeight: '800', lineHeight: 17, marginTop: 3 },
  inlineDemoButton: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  inlineDemoText: { color: '#1267e6', fontSize: 15, fontWeight: '900' },
  weekPanel: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  opensimNoticeCard: { alignItems: 'flex-start', backgroundColor: '#e8fbf8', borderColor: '#bdeee7', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 12, padding: 13 },
  opensimNoticeText: { color: '#103c39', flex: 1, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  weekTitle: { color: '#101d2c', fontSize: 17, fontWeight: '900' },
  weekDate: { color: '#60738d', fontSize: 13, marginTop: 4 },
  weekCount: { color: '#1267e6', fontSize: 16, fontWeight: '900' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, marginTop: 16 },
  dayItem: { alignItems: 'center', gap: 8 },
  dayText: { color: '#31445c', fontSize: 12, fontWeight: '800' },
  dayDot: { alignItems: 'center', borderColor: '#cbd8e8', borderRadius: 18, borderWidth: 2, height: 34, justifyContent: 'center', width: 34 },
  dayDotActive: { backgroundColor: '#1267e6', borderColor: '#1267e6' },
  dayDotText: { color: '#ffffff', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  exerciseCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1e8f2', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 13, marginBottom: 11, padding: 12 },
  exerciseThumb: { backgroundColor: '#eef5ff', borderRadius: 15, height: 76, overflow: 'hidden', width: 82 },
  exerciseCoverImage: { height: '100%', width: '100%' },
  exerciseCopy: { flex: 1 },
  exerciseTitle: { color: '#101d2c', fontSize: 16, fontWeight: '900' },
  exerciseImproves: { color: '#596c82', fontSize: 13, lineHeight: 18, marginTop: 5 },
  exerciseDose: { color: '#101d2c', fontSize: 15, fontWeight: '800', marginTop: 6 },
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
  demoSectionTitle: { color: '#05e1d2', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  demoRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, marginBottom: 10 },
  demoRowText: { color: '#e6f1ff', flex: 1, fontSize: 15, lineHeight: 22 },
  divider: { backgroundColor: '#23415f', height: 1, marginVertical: 12 },
  warningTitle: { color: '#ffca45', fontSize: 19, fontWeight: '900', marginBottom: 10 },
  startTrainingButton: { alignItems: 'center', backgroundColor: '#1267e6', borderRadius: 18, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 18, minHeight: 56 },
  startTrainingText: { color: '#ffffff', fontSize: 19, fontWeight: '900' },
});
