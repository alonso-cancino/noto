; NSIS Custom Script for Noto Installer
; This script provides additional customization for the Windows installer

!macro customHeader
  ; Custom header for installer
  ; Add any registry keys or pre-installation tasks here
!macroend

!macro customInstall
  ; Custom installation steps
  ; Executed during installation

  ; Create Start Menu folder
  CreateDirectory "$SMPROGRAMS\Noto"

  ; Associate .md files with Noto (optional, commented out by default)
  ; WriteRegStr HKCR ".md" "" "Noto.MarkdownFile"
  ; WriteRegStr HKCR "Noto.MarkdownFile" "" "Markdown File"
  ; WriteRegStr HKCR "Noto.MarkdownFile\DefaultIcon" "" "$INSTDIR\Noto.exe,0"
  ; WriteRegStr HKCR "Noto.MarkdownFile\shell\open\command" "" '"$INSTDIR\Noto.exe" "%1"'
!macroend

!macro customUnInstall
  ; Custom uninstallation steps
  ; Executed during uninstallation

  ; Remove Start Menu folder
  RMDir /r "$SMPROGRAMS\Noto"

  ; Remove file associations (if they were created)
  ; DeleteRegKey HKCR ".md"
  ; DeleteRegKey HKCR "Noto.MarkdownFile"
!macroend

!macro customInit
  ; Custom initialization
  ; Check for .NET Framework or other prerequisites here if needed
!macroend
