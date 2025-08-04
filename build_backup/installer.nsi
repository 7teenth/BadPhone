!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"
!pragma warning disable 6029

OutFile "BadPhone.exe"

!ifndef MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE
!endif

!ifndef MUI_HEADERIMAGE_RIGHT
  !define MUI_HEADERIMAGE_RIGHT
!endif

!insertmacro MUI_PAGE_WELCOME

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Function .onInit
FunctionEnd

Function CustomShow
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateBitmap} 0 0 100% 100% ""
  Pop $1
  System::Call 'user32::LoadImage(i 0, t "${PROJECT_DIR}\\public\\background.bmp", i ${IMAGE_BITMAP}, i 0, i 0, i ${LR_LOADFROMFILE}) i .r2'
  SendMessage $1 ${STM_SETIMAGE} ${IMAGE_BITMAP} $2

  ${NSD_CreateBitmap} 20u 20u 200u 60u ""
  Pop $3
  System::Call 'user32::LoadImage(i 0, t "${PROJECT_DIR}\\public\\logo.bmp", i ${IMAGE_BITMAP}, i 0, i 0, i ${LR_LOADFROMFILE}) i .r4'
  SendMessage $3 ${STM_SETIMAGE} ${IMAGE_BITMAP} $4

  nsDialogs::Show
FunctionEnd

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${PROJECT_DIR}\\.next\\*.*"
  File /r "${PROJECT_DIR}\\public\\*.*"
  File "${PROJECT_DIR}\\main.js"
  File "${PROJECT_DIR}\\package.json"
  File "${PROJECT_DIR}\\next.config.mjs"
SectionEnd
