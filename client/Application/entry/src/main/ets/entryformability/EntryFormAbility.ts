import formInfo from '@ohos.app.form.formInfo';
import formBindingData from '@ohos.app.form.formBindingData';
import FormExtensionAbility from '@ohos.app.form.FormExtensionAbility';
import hilog from '@ohos.hilog';
import http from '@ohos.net.http';
import formProvider from '@ohos.app.form.formProvider';

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
    return new Promise((resolve, reject) => {
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
            reject(err);
          }
          var dialogueJSONString = JSON.parse(data.result.toString());
          if (dialogueJSONString) {
            this.topDialogue = dialogueJSONString[0];
            resolve(err);
          }
        }
      )
    });
  }

  sendResponse() {
    return new Promise((resolve, reject) => {
      // Find the dialogue in the array based on the 'rpid'
      this.topDialogue["reply_status"] = "unchanged";
      let httpDataDeliver = http.createHttp();
      httpDataDeliver.request(
        "http://192.168.31.2/accept",
        {
          method: http.RequestMethod.POST,
          header: {
            "Content-Type": "application/json",
            "charset": "utf-8",
          },
          extraData: JSON.stringify(this.topDialogue),
          connectTimeout: 60000,
          readTimeout: 60000
        },
        (err) => {
          if (err) {
            hilog.info(0x0000, 'testTag', '%{public}s', 'Request failed: ' + JSON.stringify(err));
            reject(err);
          }
          resolve(err);
        });
    });
  }

  onAddForm(want) {
    // Called to return a FormBindingData object.
    this.getTopDialogue()
    return formBindingData.createFormBindingData({"dialogue": this.topDialogue});
  }

  onCastToNormalForm(formId) {
    // Called when the form provider is notified that a temporary form is successfully
    // converted to a normal form.
  }

  onUpdateForm(formId) {
    // Called to notify the form provider to update a specified form.
    this.getTopDialogue().then(() => {
      let formData = {
        "dialogue": this.topDialogue
      };
      let formInfo = formBindingData.createFormBindingData(formData)
      formProvider.updateForm(formId, formInfo)
    }).catch((err) => {
      hilog.info(0x0000, 'testTag', '%{public}s', 'getTopDialogue failed: ' + JSON.stringify(err));
    });
  }

  onChangeFormVisibility(newStatus) {
    // Called when the form provider receives form events from the system.

    for (let key in newStatus) {
      this.getTopDialogue().then(() => {
        let formData = {
          "dialogue": this.topDialogue
        };
        let formInfo = formBindingData.createFormBindingData(formData)
        formProvider.updateForm(key, formInfo).then((data) => {
          console.log('FormExtensionAbility context updateForm, data: ${data}');
        }).catch((error) => {
          console.error('Operation updateForm failed. Cause: ${error}');
        });
      }).catch((err) => {
        hilog.info(0x0000, 'testTag', '%{public}s', 'getTopDialogue failed: ' + JSON.stringify(err));
      });

    }
  }

  onFormEvent(formId, message) {
    // Called when a specified message event defined by the form provider is triggered.
    // hilog.info(0x0000, 'testTag', '%{public}s', `FormAbility onEvent, formId = ${formId}, message: ${JSON.stringify(message)}`);
    this.sendResponse().then(() => {
      this.getTopDialogue().then(() => {
        let formData = {
          "dialogue": this.topDialogue
        };
        let formInfo = formBindingData.createFormBindingData(formData)
        formProvider.updateForm(formId, formInfo)
      }).catch((err) => {
        hilog.info(0x0000, 'testTag', '%{public}s', 'getTopDialogue failed: ' + JSON.stringify(err));
      });
    }).catch((err) => {
      hilog.info(0x0000, 'testTag', '%{public}s', 'sendResponse failed: ' + JSON.stringify(err));
    });
  }

  onRemoveForm(formId) {
    // Called to notify the form provider that a specified form has been destroyed.
  }

  onAcquireFormState(want) {
    // Called to return a {@link FormState} object.
    return formInfo.FormState.READY;
  }
};