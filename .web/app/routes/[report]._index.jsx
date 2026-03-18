import {Fragment,useCallback,useContext,useEffect,useRef} from "react"
import {Box as RadixThemesBox,Button as RadixThemesButton,Callout as RadixThemesCallout,Code as RadixThemesCode,Flex as RadixThemesFlex,Heading as RadixThemesHeading,Link as RadixThemesLink,Text as RadixThemesText} from "@radix-ui/themes"
import {Link as ReactRouterLink} from "react-router"
import {} from "react-dropzone"
import {ReflexEvent,isTrue,refs} from "$/utils/state"
import {EventLoopContext,StateContexts,UploadFilesContext} from "$/utils/context"
import {useDropzone} from "react-dropzone"
import {Info as LucideInfo} from "lucide-react"
import {jsx} from "@emotion/react"




function Comp_6ca62b70e54373a937c21e7652ad399e () {
  const ref_patient_left_upload = useRef(null); refs["ref_patient_left_upload"] = ref_patient_left_upload;
const [addEvents, connectErrors] = useContext(EventLoopContext);
const [filesById, setFilesById] = useContext(UploadFilesContext);
const on_drop_69c323a358002864ff86e1449aa1754f = useCallback(e => setFilesById(filesById => {
    const updatedFilesById = Object.assign({}, filesById);
    updatedFilesById["patient_left_upload"] = e;
    return updatedFilesById;
  })
    , [addEvents, ReflexEvent, filesById, setFilesById])
const on_drop_rejected_bedc1fe7e7d4fcbcbc646af9fb7688c4 = useCallback(((_ev_0) => (addEvents([(ReflexEvent("_call_function", ({ ["function"] : (() => (refs['__toast']?.["error"]("", ({ ["title"] : "Files not Accepted", ["description"] : _ev_0.map(((pmuoeieh) => (pmuoeieh?.["file"]?.["path"]+": "+pmuoeieh?.["errors"].map(((xrrixsns) => xrrixsns?.["message"])).join(", ")))).join("\n\n"), ["closeButton"] : true, ["style"] : ({ ["whiteSpace"] : "pre-line" }) })))), ["callback"] : null }), ({  })))], [_ev_0], ({  })))), [addEvents, ReflexEvent])
const { getRootProps: miuwrhvk, getInputProps: tufrxhfo, isDragActive: yybhbzkm} = useDropzone(({ ["multiple"] : false, ["accept"] : ({ ["video/*"] : [".mov", ".mp4", ".avi", ".mkv"] }), ["id"] : "patient_left_upload", ["onDrop"] : on_drop_69c323a358002864ff86e1449aa1754f, ["onDropRejected"] : on_drop_rejected_bedc1fe7e7d4fcbcbc646af9fb7688c4 }));



  return (
    jsx(Fragment,{},jsx(RadixThemesBox,{className:"rx-Upload",css:({ ["border"] : "1px dashed #cbd5e1", ["borderRadius"] : "16px", ["padding"] : "1.25rem", ["width"] : "100%", ["background"] : "#fafafa", ["textAlign"] : "center" }),id:"patient_left_upload",ref:ref_patient_left_upload,...miuwrhvk()},jsx("input",{type:"file",...tufrxhfo()},),jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",direction:"column",gap:"2"},jsx(RadixThemesButton,{color:"blue",variant:"soft"},"Choose LEFT walking video"),jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#6b7280" }),size:"2"},"Accepted formats: .mov, .mp4, .avi, .mkv"))))
  )
}


function Code_8bb8e0afd35864ce75ad779451eec390 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(RadixThemesCode,{},reflex___state____state__axonai_vps___axonai_vps____state.patient_left_video_name_rx_state_)
  )
}


function Fragment_9a3f3247056e4e546dcb0b04d2940f9e () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(Fragment,{},(!((reflex___state____state__axonai_vps___axonai_vps____state.patient_left_video_name_rx_state_?.valueOf?.() === ""?.valueOf?.()))?(jsx(Fragment,{},jsx(RadixThemesText,{as:"p",css:({ ["marginTop"] : "0.8rem" })},"Selected file: ",jsx(Code_8bb8e0afd35864ce75ad779451eec390,{},)))):(jsx(Fragment,{},jsx(RadixThemesText,{as:"p",css:({ ["marginTop"] : "0.8rem", ["color"] : "#6b7280" })},"No file uploaded yet.")))))
  )
}


function Button_c2264d92435ccb684c381b803d6e185f () {
  const [filesById, setFilesById] = useContext(UploadFilesContext);
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_click_e6521c7b1eb34f0e5c95c68af2955616 = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.handle_patient_left_upload", ({ ["files"] : filesById?.["patient_left_upload"], ["upload_id"] : "patient_left_upload", ["extra_headers"] : ({  }) }), ({  }), "uploadFiles"))], [_e], ({  })))), [addEvents, ReflexEvent, filesById, setFilesById])

  return (
    jsx(RadixThemesButton,{css:({ ["width"] : "100%", ["marginTop"] : "0.9rem", ["borderRadius"] : "12px" }),onClick:on_click_e6521c7b1eb34f0e5c95c68af2955616,size:"3"},"Upload")
  )
}


function Comp_2e3773a07e8407c2849edd656660261a () {
  const ref_patient_right_upload = useRef(null); refs["ref_patient_right_upload"] = ref_patient_right_upload;
const [addEvents, connectErrors] = useContext(EventLoopContext);
const [filesById, setFilesById] = useContext(UploadFilesContext);
const on_drop_97984056d09dae0923f9cb8091af1a58 = useCallback(e => setFilesById(filesById => {
    const updatedFilesById = Object.assign({}, filesById);
    updatedFilesById["patient_right_upload"] = e;
    return updatedFilesById;
  })
    , [addEvents, ReflexEvent, filesById, setFilesById])
const on_drop_rejected_93682d868b73b9096d5e1b100bdceaa6 = useCallback(((_ev_0) => (addEvents([(ReflexEvent("_call_function", ({ ["function"] : (() => (refs['__toast']?.["error"]("", ({ ["title"] : "Files not Accepted", ["description"] : _ev_0.map(((iyukdjnf) => (iyukdjnf?.["file"]?.["path"]+": "+iyukdjnf?.["errors"].map(((oaxxiqyf) => oaxxiqyf?.["message"])).join(", ")))).join("\n\n"), ["closeButton"] : true, ["style"] : ({ ["whiteSpace"] : "pre-line" }) })))), ["callback"] : null }), ({  })))], [_ev_0], ({  })))), [addEvents, ReflexEvent])
const { getRootProps: bdeufzvn, getInputProps: mlheqpcy, isDragActive: tcmmtoqi} = useDropzone(({ ["multiple"] : false, ["accept"] : ({ ["video/*"] : [".mov", ".mp4", ".avi", ".mkv"] }), ["id"] : "patient_right_upload", ["onDrop"] : on_drop_97984056d09dae0923f9cb8091af1a58, ["onDropRejected"] : on_drop_rejected_93682d868b73b9096d5e1b100bdceaa6 }));



  return (
    jsx(Fragment,{},jsx(RadixThemesBox,{className:"rx-Upload",css:({ ["border"] : "1px dashed #cbd5e1", ["borderRadius"] : "16px", ["padding"] : "1.25rem", ["width"] : "100%", ["background"] : "#fafafa", ["textAlign"] : "center" }),id:"patient_right_upload",ref:ref_patient_right_upload,...bdeufzvn()},jsx("input",{type:"file",...mlheqpcy()},),jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",direction:"column",gap:"2"},jsx(RadixThemesButton,{color:"blue",variant:"soft"},"Choose RIGHT walking video"),jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#6b7280" }),size:"2"},"Accepted formats: .mov, .mp4, .avi, .mkv"))))
  )
}


function Code_7aa36590226707b7115d27905488266a () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(RadixThemesCode,{},reflex___state____state__axonai_vps___axonai_vps____state.patient_right_video_name_rx_state_)
  )
}


function Fragment_14702a49350a320bb41efa6364bf9d0a () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(Fragment,{},(!((reflex___state____state__axonai_vps___axonai_vps____state.patient_right_video_name_rx_state_?.valueOf?.() === ""?.valueOf?.()))?(jsx(Fragment,{},jsx(RadixThemesText,{as:"p",css:({ ["marginTop"] : "0.8rem" })},"Selected file: ",jsx(Code_7aa36590226707b7115d27905488266a,{},)))):(jsx(Fragment,{},jsx(RadixThemesText,{as:"p",css:({ ["marginTop"] : "0.8rem", ["color"] : "#6b7280" })},"No file uploaded yet.")))))
  )
}


function Button_b8b5278f877a1aff7d5010c1724174db () {
  const [filesById, setFilesById] = useContext(UploadFilesContext);
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_click_8c8dbbbe46f467e799cfcfee36016afa = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.handle_patient_right_upload", ({ ["files"] : filesById?.["patient_right_upload"], ["upload_id"] : "patient_right_upload", ["extra_headers"] : ({  }) }), ({  }), "uploadFiles"))], [_e], ({  })))), [addEvents, ReflexEvent, filesById, setFilesById])

  return (
    jsx(RadixThemesButton,{css:({ ["width"] : "100%", ["marginTop"] : "0.9rem", ["borderRadius"] : "12px" }),onClick:on_click_8c8dbbbe46f467e799cfcfee36016afa,size:"3"},"Upload")
  )
}


function Button_04f133a614ea5ba79066cfb3901b0e71 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_click_ff0a0bc03959812a098212c90400ddef = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.generate_empty_pdf_and_download", ({  }), ({  })))], [_e], ({  })))), [addEvents, ReflexEvent])

  return (
    jsx(RadixThemesButton,{css:({ ["borderRadius"] : "9999px", ["paddingInlineStart"] : "1.5rem", ["paddingInlineEnd"] : "1.5rem" }),disabled:!(reflex___state____state__axonai_vps___axonai_vps____state.can_generate_report_rx_state_),onClick:on_click_ff0a0bc03959812a098212c90400ddef,size:"4"},"Generate report")
  )
}


function Callout__text_7a73186368d7c5adb925930b3ad165c0 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(RadixThemesCallout.Text,{},reflex___state____state__axonai_vps___axonai_vps____state.report_status_rx_state_)
  )
}


function Fragment_58c2b90ce7c90cf194bca438e82867e8 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(Fragment,{},(!((reflex___state____state__axonai_vps___axonai_vps____state.report_status_rx_state_?.valueOf?.() === ""?.valueOf?.()))?(jsx(Fragment,{},jsx(RadixThemesCallout.Root,{css:({ ["icon"] : "info", ["width"] : "100%" })},jsx(RadixThemesCallout.Icon,{},jsx(LucideInfo,{},)),jsx(Callout__text_7a73186368d7c5adb925930b3ad165c0,{},)))):(jsx(Fragment,{},))))
  )
}


export default function Component() {





  return (
    jsx(Fragment,{},jsx(RadixThemesBox,{css:({ ["minHeight"] : "100vh", ["width"] : "100%", ["padding"] : "2.5rem", ["background"] : "\n            radial-gradient(circle at top left, rgba(16,185,129,0.08), transparent 30%),\n            linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%)\n        " })},jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",css:({ ["width"] : "100%", ["maxWidth"] : "1200px" }),direction:"column",gap:"5"},jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",css:({ ["width"] : "100%" }),direction:"row",gap:"3"},jsx(RadixThemesLink,{asChild:true,css:({ ["&:hover"] : ({ ["color"] : "var(--accent-8)" }) })},jsx(ReactRouterLink,{to:"/configure"},jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#2563eb", ["fontWeight"] : "600" })},"\u2190 Back to configuration")))),jsx(RadixThemesHeading,{css:({ ["color"] : "#0f172a" }),size:"8"},"Step 2 \u2014 Generate patient report"),jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#475569" }),size:"4"},"Upload the patient's walking videos from the left and right cameras, then generate a report."),jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",css:({ ["width"] : "100%", ["flexWrap"] : "wrap" }),direction:"row",gap:"4"},jsx(RadixThemesBox,{css:({ ["background"] : "white", ["border"] : "1px solid #e5e7eb", ["borderRadius"] : "20px", ["padding"] : "1.2rem", ["boxShadow"] : "0 10px 30px rgba(2, 6, 23, 0.05)", ["width"] : "100%" })},jsx(RadixThemesText,{as:"p",css:({ ["fontWeight"] : "600", ["fontSize"] : "1.1rem", ["marginBottom"] : "0.8rem" })},"Upload patient LEFT walking video"),jsx(Comp_6ca62b70e54373a937c21e7652ad399e,{},),jsx(Fragment_9a3f3247056e4e546dcb0b04d2940f9e,{},),jsx(Button_c2264d92435ccb684c381b803d6e185f,{},)),jsx(RadixThemesBox,{css:({ ["background"] : "white", ["border"] : "1px solid #e5e7eb", ["borderRadius"] : "20px", ["padding"] : "1.2rem", ["boxShadow"] : "0 10px 30px rgba(2, 6, 23, 0.05)", ["width"] : "100%" })},jsx(RadixThemesText,{as:"p",css:({ ["fontWeight"] : "600", ["fontSize"] : "1.1rem", ["marginBottom"] : "0.8rem" })},"Upload patient RIGHT walking video"),jsx(Comp_2e3773a07e8407c2849edd656660261a,{},),jsx(Fragment_14702a49350a320bb41efa6364bf9d0a,{},),jsx(Button_b8b5278f877a1aff7d5010c1724174db,{},))),jsx(Button_04f133a614ea5ba79066cfb3901b0e71,{},),jsx(Fragment_58c2b90ce7c90cf194bca438e82867e8,{},))),jsx("title",{},"Generate Report"),jsx("meta",{content:"favicon.ico",property:"og:image"},))
  )
}