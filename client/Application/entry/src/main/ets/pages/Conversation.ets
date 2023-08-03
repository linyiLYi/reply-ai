import http from '@ohos.net.http'
import hilog from '@ohos.hilog';
import EntryFormAbility from '../entryformability/EntryFormAbility';

@Entry
@Component
struct Conversation {
  @State message: string = 'Hello World'

  @State dialogues: any[] = [{
    "rpid": "xxxxxxxxxxxx",
    "content": {
      "message": "暂无评论"
    },
    "reply": "暂无回复",
    "member": {
      "uname": "暂无用户"
    },
    "isEditing": false
  }]

  @State refreshing: boolean = false;
  @State currentlyEditing: any = null;

  async aboutToAppear(){
    this.getDialogues();
  }

  onPageShow(){
    this.getDialogues();
  }

  onPageHide(){

  }

  getDialogues(){
    let httpDataRequest = http.createHttp();
    httpDataRequest.request(
      "http://192.168.31.2/comments",
      {
        method: http.RequestMethod.GET,
        header: {
          "Content-Type": "application/json",
          "charset": "utf-8",
        },
        connectTimeout: 60000,
        readTimeout: 60000
      },
      (err, data) => {
        if (err) {
          hilog.info(0x0000, 'testTag', '%{public}s', 'Request failed: ' + JSON.stringify(err));
          this.refreshing = false;
          return;
        }
        var dialogueJSONString = JSON.parse(data.result.toString());
        if (dialogueJSONString) {
          this.dialogues = dialogueJSONString.map(dialogue => ({...dialogue, isEditing: false}));
        }
        this.refreshing = false;
      }
    )
  }

  async handleResponse(rpid:string, action: string) {
    // Find the dialogue in the array based on the 'rpid'
    const index = this.dialogues.findIndex(dialogue => dialogue.rpid === rpid);
    if (index > -1) {
      // Assigning reply_status based on button pressed
      const dialogue = this.dialogues[index];
      if(action === "Accept") {
        dialogue["reply_status"] = "unchanged";
      } else if(action === "Submit") {
        dialogue["reply_status"] = "revised";
      } else if(action === "Reject") {
        dialogue["reply_status"] = "rejected";
      }

      let httpDataDeliver = http.createHttp();
      httpDataDeliver.request(
        "http://192.168.31.2/accept",
        {
          method: http.RequestMethod.POST,
          header: {
            "Content-Type": "application/json",
            "charset": "utf-8",
          },
          extraData: JSON.stringify(dialogue),
          connectTimeout: 60000,
          readTimeout: 60000
        },
        (err) => {
          if (err) {
            hilog.info(0x0000, 'testTag', '%{public}s', 'Request failed: ' + JSON.stringify(err));
            return;
          }
          this.dialogues.splice(index, 1);
          dialogue.isEditing = false;  // Exit edit mode after the request is completed.
          this.currentlyEditing = null; // Add this line
        }
      );
    }
  }

  build() {
    Column() {
      Column() {
        // Text("待确认回复")
        //   .width("300vp")
        //   .height("60vp")
        //   .textAlign(TextAlign.Center)
        //   .fontSize("30fp")
        //   .fontWeight(FontWeight.Bold)
        Refresh({ refreshing: this.refreshing }) {
          List() {
            ForEach(this.dialogues,
              (dialogue: any) => {
                ListItem() {
                  Column() {
                    Text(`${dialogue.member.uname}：${dialogue.content.message}`)
                      .width("100%")
                      .textAlign(TextAlign.Start)
                      .textOverflow({ overflow: TextOverflow.None })
                      .fontSize("16fp")
                      .fontWeight(FontWeight.Bold)
                      .fontFamily("sans-serif")
                      .lineHeight("22fp")
                      .margin({ top: "20vp", bottom: "20vp", left: "0vp", right: "0vp" })
                    if (!dialogue.isEditing) {
                      Text(dialogue.reply)
                        .width("100%")
                        .textOverflow({ overflow: TextOverflow.None })
                        .fontSize("16fp")
                        .fontFamily("sans-serif")
                        .lineHeight("22fp")
                        .margin({ top: "0vp", bottom: "20vp", left: "0vp", right: "0vp" })
                    }
                    else {
                      TextArea({text: dialogue.reply}) // Starts out with the original reply by YUN RUO (the AI assistant).
                        .width("100%")
                        .fontSize("16fp")
                        .fontFamily("sans-serif")
                        .margin({ top: "0vp", bottom: "20vp", left: "0vp", right: "0vp" })
                        .onChange((value) => {
                          dialogue.reply = value;
                        })
                    }
                    Row() {
                      if (!dialogue.isEditing) {
                        Button($r("app.string.button_text_accept"))
                          .width("33%")
                          .backgroundColor("#8BC34A")
                          .type(ButtonType.Normal)
                          .onClick(() => this.handleResponse(dialogue.rpid, "Accept"))
                        Button($r("app.string.button_text_reject"))
                          .width("33%")
                          .backgroundColor("#E57373")
                          .type(ButtonType.Normal)
                          .onClick(() => this.handleResponse(dialogue.rpid, "Reject"))
                      }
                      Button(dialogue.isEditing ? $r("app.string.button_text_submit") : $r("app.string.button_text_edit"))
                        .width(dialogue.isEditing ? "80%" : "33%")
                        .backgroundColor(dialogue.isEditing ? "#8BC34A" : "#64B5F6")  // Change color based on the state.
                        .type(ButtonType.Normal)
                        .onClick(() => {
                          if (dialogue.isEditing) {
                            this.handleResponse(dialogue.rpid, "Submit");  // Submit the changes when isEditing is true.
                          } else {
                            const index = this.dialogues.indexOf(dialogue);
                            this.dialogues[index] = {...dialogue, isEditing: true};  // Replace dialogue object with a new one that has isEditing set to true.
                            this.currentlyEditing = dialogue;
                          }
                        })
                    }
                    .width("100%")
                    .margin({ top: "0vp", bottom: "20vp", left: "0vp", right: "0vp" })
                    .justifyContent(FlexAlign.SpaceEvenly)
                  }
                  .width("100%")
                  .borderWidth("2vp")
                  .borderColor("#BDBDBD")
                  .borderRadius("10vp")
                  .backgroundColor("#F5F5F5")
                  .margin({ top: "0vp", bottom: "0vp", left: "0vp", right: "0vp" })
                  .padding({ top: "20vp", bottom: "20vp", left: "20vp", right: "20vp" })
                }
                .width("100%")
                // .shadow({
                //   radius: 50,
                //   color: Color.Grey,
                //   offsetX: vp2px(5),
                //   offsetY: vp2px(5)
                // })
                .margin({ top: "0vp", bottom: "40vp", left: "0vp", right: "0vp" })
              })
          }
          .width("100%")
          .height("150%")
          .margin({ top: "0vp", bottom: "0vp", left: "0vp", right: "0vp" })
          .padding({ top: "10vp", bottom: "20vp", left: "10vp", right: "10vp" })
          .listDirection(Axis.Vertical)
        }
        .onRefreshing(() => {
          this.refreshing = true;
          this.getDialogues();
        })
      }
      .width("100%")
      .height("150%")
      .margin({ bottom: "0vp" })
      .padding({ top: "10vp", bottom: "200vp", left: "0vp", right: "0vp" })
      .justifyContent(FlexAlign.Start)
    }
    .width("100%")
    .height("150%")
  }
}