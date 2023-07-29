import formInfo from '@ohos.app.form.formInfo';
import formBindingData from '@ohos.app.form.formBindingData';
import FormExtensionAbility from '@ohos.app.form.FormExtensionAbility';
import hilog from '@ohos.hilog';
import http from '@ohos.net.http';

export default class EntryFormAbility extends FormExtensionAbility {

  topDialogue: any = {
    "rpid": "xxxxxxxxxxxx",
    "content": {
      "message": "暂无评论"
    },
    "reply": "暂无回复",
    "member": {
      "uname": "暂无用户"
    }
  }

  getTopDialogue() {
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
          return;
        }
        var dialogueJSONString = JSON.parse(data.result.toString());
        if (dialogueJSONString) {
          this.topDialogue = dialogueJSONString[0];
        }
      }
    )
  }

  onAddForm(want) {
    // Called to return a FormBindingData object.
    this.getTopDialogue();
    let formData = {
      "dialogue": this.topDialogue
    };
    return formBindingData.createFormBindingData(formData);
  }

  onCastToNormalForm(formId) {
    // Called when the form provider is notified that a temporary form is successfully
    // converted to a normal form.
  }

  onUpdateForm(formId) {
    // Called to notify the form provider to update a specified form.
  }

  onChangeFormVisibility(newStatus) {
    // Called when the form provider receives form events from the system.
    for (let key in newStatus) {
      if (newStatus[key] === formInfo.VisibilityType.FORM_VISIBLE) {
        // update the top dialogue
        this.getTopDialogue();
        // update the form data
        let formData = {
          "dialogue": this.topDialogue
        };
        formBindingData.createFormBindingData(formData);
      }
    }
  }

  onFormEvent(formId, message) {
    // Called when a specified message event defined by the form provider is triggered.
  }

  onRemoveForm(formId) {
    // Called to notify the form provider that a specified form has been destroyed.
  }

  onAcquireFormState(want) {
    // Called to return a {@link FormState} object.
    return formInfo.FormState.READY;
  }
};