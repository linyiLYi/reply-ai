import os
import json

from bilibili_api import comment, sync, Credential
from flask import Flask, jsonify, request

app = Flask(__name__)

# Load the credentials when the application starts
with open("config.json", "r") as f:
    values = json.load(f)

CREDENTIAL = Credential(
    sessdata=values["SESSDATA"], 
    bili_jct=values["bili_jct"], 
    buvid3=values["buvid3"], 
    dedeuserid=values["dedeuserid"]
)

@app.route('/comments', methods=['GET'])
def get_comments():
    if os.path.exists('comments.json'):
        with open('comments.json', 'r') as f:
            comments = json.load(f)
        return jsonify(comments)
    else:
        return jsonify({'error': 'comments.json not found'}), 404
    
@app.route('/accept', methods=['POST'])
def accept_comment():
    accepted_comment = request.json
    # print(f'Accepted comment: {accepted_comment}')
    # print(accepted_comment['oid'])
    # print(accepted_comment['reply_status'])
    reply = accepted_comment['reply']
    if accepted_comment["reply_status"] == "unchanged":
        reply += "\n--来自云若，林亦的AI助理，经林亦确认后发出。"
    elif accepted_comment["reply_status"] == "revised":
        reply += "\n--来自云若，林亦的AI助理，经林亦修改后发出。"
    elif accepted_comment["reply_status"] == "rejected":
        reply = "云若给出了一个不恰当的回复，已记录。谢谢你帮忙找了个漏洞出来！\n--来自林亦"
        
    print(reply)
    
    # Send reply to bilibili
    # result = sync(send_reply(
    #     reply, 
    #     accepted_comment['oid'],
    #     accepted_comment
    # ))

    return jsonify({'status': 'accepted'}), 200

async def send_reply(reply, aid, cmt):
    result = await comment.send_comment(
        reply, 
        aid, 
        comment.CommentResourceType.VIDEO, 
        root=cmt['rpid'],
        credential=CREDENTIAL
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
