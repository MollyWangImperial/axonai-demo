import {Fragment,useCallback,useContext,useEffect,useRef} from "react"
import {Badge as RadixThemesBadge,Box as RadixThemesBox,Button as RadixThemesButton,Callout as RadixThemesCallout,Code as RadixThemesCode,Flex as RadixThemesFlex,Heading as RadixThemesHeading,Link as RadixThemesLink,Text as RadixThemesText,TextField as RadixThemesTextField} from "@radix-ui/themes"
import {Link as ReactRouterLink} from "react-router"
import DebounceInput from "react-debounce-input"
import {EventLoopContext,StateContexts,UploadFilesContext} from "$/utils/context"
import {ReflexEvent,isNotNullOrUndefined,isTrue,refs} from "$/utils/state"
import {} from "react-dropzone"
import {useDropzone} from "react-dropzone"
import {Info as LucideInfo} from "lucide-react"
import {jsx} from "@emotion/react"




function Debounceinput_9e7202c8ee5421c5c26aa6afd46c7020 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_change_01743be64ee761dcafb3cad21909f6ea = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.set_cols", ({ ["value"] : _e?.["target"]?.["value"] }), ({  })))], [_e], ({  })))), [addEvents, ReflexEvent])

  return (
    jsx(DebounceInput,{css:({ ["width"] : "100%", ["background"] : "white", ["border"] : "1px solid #d1d5db" }),debounceTimeout:300,element:RadixThemesTextField.Root,max:25,min:3,onChange:on_change_01743be64ee761dcafb3cad21909f6ea,size:"3",step:1,type:"number",value:(isNotNullOrUndefined(reflex___state____state__axonai_vps___axonai_vps____state.cols_rx_state_) ? reflex___state____state__axonai_vps___axonai_vps____state.cols_rx_state_ : "")},)
  )
}


function Debounceinput_08f5af5faf02c351b8c1c866b6086568 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_change_e9bafe23e5ea5cceedbbfdd693d51568 = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.set_rows", ({ ["value"] : _e?.["target"]?.["value"] }), ({  })))], [_e], ({  })))), [addEvents, ReflexEvent])

  return (
    jsx(DebounceInput,{css:({ ["width"] : "100%", ["background"] : "white", ["border"] : "1px solid #d1d5db" }),debounceTimeout:300,element:RadixThemesTextField.Root,max:25,min:3,onChange:on_change_e9bafe23e5ea5cceedbbfdd693d51568,size:"3",step:1,type:"number",value:(isNotNullOrUndefined(reflex___state____state__axonai_vps___axonai_vps____state.rows_rx_state_) ? reflex___state____state__axonai_vps___axonai_vps____state.rows_rx_state_ : "")},)
  )
}


function Debounceinput_cd108bd5b5e1d19837c6559d589d3eb2 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_change_d9d879d43bc9ae3f6361141bb408741d = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.set_square_size_mm", ({ ["value"] : _e?.["target"]?.["value"] }), ({  })))], [_e], ({  })))), [addEvents, ReflexEvent])

  return (
    jsx(DebounceInput,{css:({ ["width"] : "100%", ["background"] : "white", ["border"] : "1px solid #d1d5db" }),debounceTimeout:300,element:RadixThemesTextField.Root,max:200,min:1,onChange:on_change_d9d879d43bc9ae3f6361141bb408741d,size:"3",step:1,type:"number",value:(isNotNullOrUndefined(reflex___state____state__axonai_vps___axonai_vps____state.square_size_mm_rx_state_) ? reflex___state____state__axonai_vps___axonai_vps____state.square_size_mm_rx_state_ : "")},)
  )
}


function Comp_284d9550a9bc65020581c0faa5905856 () {
  const ref_left_upload = useRef(null); refs["ref_left_upload"] = ref_left_upload;
const [addEvents, connectErrors] = useContext(EventLoopContext);
const [filesById, setFilesById] = useContext(UploadFilesContext);
const on_drop_9ed6ea033e7beeb205a1b295ccfcf10e = useCallback(e => setFilesById(filesById => {
    const updatedFilesById = Object.assign({}, filesById);
    updatedFilesById["left_upload"] = e;
    return updatedFilesById;
  })
    , [addEvents, ReflexEvent, filesById, setFilesById])
const on_drop_rejected_2fcedbdc0771e7617b4270e2d1ac8cc9 = useCallback(((_ev_0) => (addEvents([(ReflexEvent("_call_function", ({ ["function"] : (() => (refs['__toast']?.["error"]("", ({ ["title"] : "Files not Accepted", ["description"] : _ev_0.map(((osizayzf) => (osizayzf?.["file"]?.["path"]+": "+osizayzf?.["errors"].map(((wnkiegyk) => wnkiegyk?.["message"])).join(", ")))).join("\n\n"), ["closeButton"] : true, ["style"] : ({ ["whiteSpace"] : "pre-line" }) })))), ["callback"] : null }), ({  })))], [_ev_0], ({  })))), [addEvents, ReflexEvent])
const { getRootProps: xdvxrcsn, getInputProps: udaxihhe, isDragActive: bacghqta} = useDropzone(({ ["multiple"] : false, ["accept"] : ({ ["video/*"] : [".mov", ".mp4", ".avi", ".mkv"] }), ["id"] : "left_upload", ["onDrop"] : on_drop_9ed6ea033e7beeb205a1b295ccfcf10e, ["onDropRejected"] : on_drop_rejected_2fcedbdc0771e7617b4270e2d1ac8cc9 }));



  return (
    jsx(Fragment,{},jsx(RadixThemesBox,{className:"rx-Upload",css:({ ["border"] : "1px dashed #cbd5e1", ["borderRadius"] : "16px", ["padding"] : "1.25rem", ["width"] : "100%", ["background"] : "#fafafa", ["textAlign"] : "center" }),id:"left_upload",ref:ref_left_upload,...xdvxrcsn()},jsx("input",{type:"file",...udaxihhe()},),jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",direction:"column",gap:"2"},jsx(RadixThemesButton,{color:"blue",variant:"soft"},"Choose LEFT video"),jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#6b7280" }),size:"2"},"Accepted formats: .mov, .mp4, .avi, .mkv"))))
  )
}


function Code_2518f70ef230dca70948ac27f0933273 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(RadixThemesCode,{},reflex___state____state__axonai_vps___axonai_vps____state.calib_video_left_name_rx_state_)
  )
}


function Fragment_602f017604ffba40684f2906a7e7574d () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(Fragment,{},(!((reflex___state____state__axonai_vps___axonai_vps____state.calib_video_left_name_rx_state_?.valueOf?.() === ""?.valueOf?.()))?(jsx(Fragment,{},jsx(RadixThemesText,{as:"p",css:({ ["marginTop"] : "0.8rem" })},"Selected file: ",jsx(Code_2518f70ef230dca70948ac27f0933273,{},)))):(jsx(Fragment,{},jsx(RadixThemesText,{as:"p",css:({ ["marginTop"] : "0.8rem", ["color"] : "#6b7280" })},"No file uploaded yet.")))))
  )
}


function Button_a83c79c245b10242121f9f75d917ce70 () {
  const [filesById, setFilesById] = useContext(UploadFilesContext);
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_click_3fd2ddfab8c5f7594eb854a23fbd07ae = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.handle_left_upload", ({ ["files"] : filesById?.["left_upload"], ["upload_id"] : "left_upload", ["extra_headers"] : ({  }) }), ({  }), "uploadFiles"))], [_e], ({  })))), [addEvents, ReflexEvent, filesById, setFilesById])

  return (
    jsx(RadixThemesButton,{css:({ ["width"] : "100%", ["marginTop"] : "0.9rem", ["borderRadius"] : "12px" }),onClick:on_click_3fd2ddfab8c5f7594eb854a23fbd07ae,size:"3"},"Upload")
  )
}


function Comp_d8fcc43dfd00fceb91ea8d2b2cdf15fc () {
  const ref_right_upload = useRef(null); refs["ref_right_upload"] = ref_right_upload;
const [addEvents, connectErrors] = useContext(EventLoopContext);
const [filesById, setFilesById] = useContext(UploadFilesContext);
const on_drop_eb1498605f730a3d33b8f4bb9e54a0c9 = useCallback(e => setFilesById(filesById => {
    const updatedFilesById = Object.assign({}, filesById);
    updatedFilesById["right_upload"] = e;
    return updatedFilesById;
  })
    , [addEvents, ReflexEvent, filesById, setFilesById])
const on_drop_rejected_51f7597a906ee6a527ceb347e5723946 = useCallback(((_ev_0) => (addEvents([(ReflexEvent("_call_function", ({ ["function"] : (() => (refs['__toast']?.["error"]("", ({ ["title"] : "Files not Accepted", ["description"] : _ev_0.map(((dmioulfl) => (dmioulfl?.["file"]?.["path"]+": "+dmioulfl?.["errors"].map(((lgviwvuc) => lgviwvuc?.["message"])).join(", ")))).join("\n\n"), ["closeButton"] : true, ["style"] : ({ ["whiteSpace"] : "pre-line" }) })))), ["callback"] : null }), ({  })))], [_ev_0], ({  })))), [addEvents, ReflexEvent])
const { getRootProps: zbxordmc, getInputProps: dcmdllti, isDragActive: rjutlsgw} = useDropzone(({ ["multiple"] : false, ["accept"] : ({ ["video/*"] : [".mov", ".mp4", ".avi", ".mkv"] }), ["id"] : "right_upload", ["onDrop"] : on_drop_eb1498605f730a3d33b8f4bb9e54a0c9, ["onDropRejected"] : on_drop_rejected_51f7597a906ee6a527ceb347e5723946 }));



  return (
    jsx(Fragment,{},jsx(RadixThemesBox,{className:"rx-Upload",css:({ ["border"] : "1px dashed #cbd5e1", ["borderRadius"] : "16px", ["padding"] : "1.25rem", ["width"] : "100%", ["background"] : "#fafafa", ["textAlign"] : "center" }),id:"right_upload",ref:ref_right_upload,...zbxordmc()},jsx("input",{type:"file",...dcmdllti()},),jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",direction:"column",gap:"2"},jsx(RadixThemesButton,{color:"blue",variant:"soft"},"Choose RIGHT video"),jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#6b7280" }),size:"2"},"Accepted formats: .mov, .mp4, .avi, .mkv"))))
  )
}


function Code_56572ed3c5ccc75db82b37ba28848a00 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(RadixThemesCode,{},reflex___state____state__axonai_vps___axonai_vps____state.calib_video_right_name_rx_state_)
  )
}


function Fragment_29a3db8fa90697b86e79608ae8ee04a4 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(Fragment,{},(!((reflex___state____state__axonai_vps___axonai_vps____state.calib_video_right_name_rx_state_?.valueOf?.() === ""?.valueOf?.()))?(jsx(Fragment,{},jsx(RadixThemesText,{as:"p",css:({ ["marginTop"] : "0.8rem" })},"Selected file: ",jsx(Code_56572ed3c5ccc75db82b37ba28848a00,{},)))):(jsx(Fragment,{},jsx(RadixThemesText,{as:"p",css:({ ["marginTop"] : "0.8rem", ["color"] : "#6b7280" })},"No file uploaded yet.")))))
  )
}


function Button_36795f888845d9d63db02c45fd272161 () {
  const [filesById, setFilesById] = useContext(UploadFilesContext);
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_click_94d2872e20b81b9d78ff629e0ae41778 = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.handle_right_upload", ({ ["files"] : filesById?.["right_upload"], ["upload_id"] : "right_upload", ["extra_headers"] : ({  }) }), ({  }), "uploadFiles"))], [_e], ({  })))), [addEvents, ReflexEvent, filesById, setFilesById])

  return (
    jsx(RadixThemesButton,{css:({ ["width"] : "100%", ["marginTop"] : "0.9rem", ["borderRadius"] : "12px" }),onClick:on_click_94d2872e20b81b9d78ff629e0ae41778,size:"3"},"Upload")
  )
}


function Debounceinput_9d22dfef0eb794301930b98b87ff6706 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)
const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_change_a09651cece8dd35eb277f974da74e205 = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.set_n_images", ({ ["value"] : _e?.["target"]?.["value"] }), ({  })))], [_e], ({  })))), [addEvents, ReflexEvent])

  return (
    jsx(DebounceInput,{css:({ ["width"] : "240px", ["background"] : "white" }),debounceTimeout:300,element:RadixThemesTextField.Root,max:100,min:5,onChange:on_change_a09651cece8dd35eb277f974da74e205,step:1,type:"number",value:(isNotNullOrUndefined(reflex___state____state__axonai_vps___axonai_vps____state.n_images_rx_state_) ? reflex___state____state__axonai_vps___axonai_vps____state.n_images_rx_state_ : "")},)
  )
}


function Button_364f5f4b70c3fe17e4ceb9a935e43124 () {
  const [addEvents, connectErrors] = useContext(EventLoopContext);

const on_click_ea56b4b4e17ce105d3186eef1a45c868 = useCallback(((_e) => (addEvents([(ReflexEvent("reflex___state____state.axonai_vps___axonai_vps____state.configure_camera", ({  }), ({  })))], [_e], ({  })))), [addEvents, ReflexEvent])

  return (
    jsx(RadixThemesButton,{css:({ ["borderRadius"] : "9999px", ["paddingInlineStart"] : "1.5rem", ["paddingInlineEnd"] : "1.5rem" }),onClick:on_click_ea56b4b4e17ce105d3186eef1a45c868,size:"4"},"\u2699\ufe0f Configure camera")
  )
}


function Callout__text_28ea1df147ded8e7f9bb1311da5f27eb () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(RadixThemesCallout.Text,{},reflex___state____state__axonai_vps___axonai_vps____state.status_message_rx_state_)
  )
}


function Fragment_1bf347185d8f548a046ad80ed1087623 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(Fragment,{},(!((reflex___state____state__axonai_vps___axonai_vps____state.status_message_rx_state_?.valueOf?.() === ""?.valueOf?.()))?(jsx(Fragment,{},jsx(RadixThemesCallout.Root,{css:({ ["icon"] : "info", ["width"] : "100%" })},jsx(RadixThemesCallout.Icon,{},jsx(LucideInfo,{},)),jsx(Callout__text_28ea1df147ded8e7f9bb1311da5f27eb,{},)))):(jsx(Fragment,{},))))
  )
}


function Fragment_eb2ef7a9796fd352391f156c134fe170 () {
  const reflex___state____state__axonai_vps___axonai_vps____state = useContext(StateContexts.reflex___state____state__axonai_vps___axonai_vps____state)



  return (
    jsx(Fragment,{},(reflex___state____state__axonai_vps___axonai_vps____state.configured_rx_state_?(jsx(Fragment,{},jsx(RadixThemesBadge,{color:"green",size:"3"},"Configured"))):(jsx(Fragment,{},))))
  )
}


export default function Component() {





  return (
    jsx(Fragment,{},jsx(RadixThemesBox,{css:({ ["minHeight"] : "100vh", ["width"] : "100%", ["padding"] : "2.5rem", ["background"] : "\n            radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 30%),\n            linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%)\n        " })},jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",css:({ ["width"] : "100%", ["maxWidth"] : "1200px" }),direction:"column",gap:"5"},jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",css:({ ["width"] : "100%" }),direction:"row",gap:"3"},jsx(RadixThemesLink,{asChild:true,css:({ ["&:hover"] : ({ ["color"] : "var(--accent-8)" }) })},jsx(ReactRouterLink,{to:"/"},jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#2563eb", ["fontWeight"] : "600" })},"\u2190 Back")))),jsx(RadixThemesHeading,{css:({ ["color"] : "#0f172a" }),size:"8"},"Step 1 \u2014 Configure camera intrinsics"),jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#475569" }),size:"4"},"Set checkerboard parameters and upload stereo calibration videos."),jsx(RadixThemesBox,{css:({ ["background"] : "rgba(255,255,255,0.9)", ["border"] : "1px solid #e5e7eb", ["borderRadius"] : "22px", ["padding"] : "1.5rem", ["boxShadow"] : "0 12px 35px rgba(15, 23, 42, 0.06)", ["width"] : "100%" })},jsx(RadixThemesHeading,{css:({ ["marginBottom"] : "1rem" }),size:"5"},"Checkerboard settings"),jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",css:({ ["width"] : "100%", ["flexWrap"] : "wrap" }),direction:"row",gap:"4"},jsx(RadixThemesBox,{css:({ ["width"] : "100%" })},jsx(RadixThemesText,{as:"p",css:({ ["marginBottom"] : "0.45rem", ["fontWeight"] : "500" })},"Cols (internal corners)"),jsx(Debounceinput_9e7202c8ee5421c5c26aa6afd46c7020,{},)),jsx(RadixThemesBox,{css:({ ["width"] : "100%" })},jsx(RadixThemesText,{as:"p",css:({ ["marginBottom"] : "0.45rem", ["fontWeight"] : "500" })},"Rows (internal corners)"),jsx(Debounceinput_08f5af5faf02c351b8c1c866b6086568,{},)),jsx(RadixThemesBox,{css:({ ["width"] : "100%" })},jsx(RadixThemesText,{as:"p",css:({ ["marginBottom"] : "0.45rem", ["fontWeight"] : "500" })},"Square size (mm)"),jsx(Debounceinput_cd108bd5b5e1d19837c6559d589d3eb2,{},)))),jsx(RadixThemesFlex,{align:"start",className:"rx-Stack",css:({ ["width"] : "100%", ["flexWrap"] : "wrap" }),direction:"row",gap:"4"},jsx(RadixThemesBox,{css:({ ["background"] : "white", ["border"] : "1px solid #e5e7eb", ["borderRadius"] : "20px", ["padding"] : "1.2rem", ["boxShadow"] : "0 10px 30px rgba(2, 6, 23, 0.05)", ["width"] : "100%" })},jsx(RadixThemesText,{as:"p",css:({ ["fontWeight"] : "600", ["fontSize"] : "1.1rem", ["marginBottom"] : "0.8rem" })},"Upload LEFT calibration video"),jsx(Comp_284d9550a9bc65020581c0faa5905856,{},),jsx(Fragment_602f017604ffba40684f2906a7e7574d,{},),jsx(Button_a83c79c245b10242121f9f75d917ce70,{},)),jsx(RadixThemesBox,{css:({ ["background"] : "white", ["border"] : "1px solid #e5e7eb", ["borderRadius"] : "20px", ["padding"] : "1.2rem", ["boxShadow"] : "0 10px 30px rgba(2, 6, 23, 0.05)", ["width"] : "100%" })},jsx(RadixThemesText,{as:"p",css:({ ["fontWeight"] : "600", ["fontSize"] : "1.1rem", ["marginBottom"] : "0.8rem" })},"Upload RIGHT calibration video"),jsx(Comp_d8fcc43dfd00fceb91ea8d2b2cdf15fc,{},),jsx(Fragment_29a3db8fa90697b86e79608ae8ee04a4,{},),jsx(Button_36795f888845d9d63db02c45fd272161,{},))),jsx(RadixThemesBox,{css:({ ["width"] : "100%" })},jsx(RadixThemesText,{as:"p",css:({ ["marginBottom"] : "0.45rem", ["fontWeight"] : "500" })},"Number of sampled frames per calibration video"),jsx(Debounceinput_9d22dfef0eb794301930b98b87ff6706,{},)),jsx(RadixThemesText,{as:"p",css:({ ["color"] : "#64748b" }),size:"3"},"Each calibration video should show the checkerboard from multiple positions and angles."),jsx(Button_364f5f4b70c3fe17e4ceb9a935e43124,{},),jsx(Fragment_1bf347185d8f548a046ad80ed1087623,{},),jsx(Fragment_eb2ef7a9796fd352391f156c134fe170,{},))),jsx("title",{},"Configure Camera"),jsx("meta",{content:"favicon.ico",property:"og:image"},))
  )
}