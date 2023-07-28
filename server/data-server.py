import os
import json

from bilibili_api import comment, sync, Credential
from flask import Flask, jsonify, request

DEBUG = False
app = Flask(__name__)

# Load the credentials when the application starts
with open("data/config.json", "r") as f:
    values = json.load(f)

CREDENTIAL = Credential(
    sessdata=values["SESSDATA"], 
    bili_jct=values["bili_jct"], 
    buvid3=values["buvid3"], 
    dedeuserid=values["dedeuserid"]
)

PROCESSED_RPID_SET = set()
if os.path.exists('data/processed_rpids.txt'):
    with open('data/processed_rpids.txt', 'r') as f:
        processed_set = {int(line.strip()) for line in f if line.strip()}

@app.route('/comments', methods=['GET'])
def get_comments():
    if os.path.exists('data/comments.json'):
        with open('data/comments.json', 'r') as f:
            comments = json.load(f)

        # Filter the comments
        comments = [c for c in comments if c['rpid'] not in PROCESSED_RPID_SET]
        return jsonify(comments)
    else:
        return jsonify({'error': 'data/comments.json not found'}), 404
    
@app.route('/accept', methods=['POST'])
def accept_comment():
    accepted_comment = request.json

    if DEBUG:
        print(f'Accepted comment: {accepted_comment}')
        print(accepted_comment['oid'])
        print(accepted_comment['reply_status'])
    
    reply = accepted_comment['reply']

    if accepted_comment["reply_status"] == "unchanged":
        reply += "\n--来自云若，林亦的AI助理，经林亦确认后发出。"
    elif accepted_comment["reply_status"] == "revised":
        reply += "\n--来自云若，林亦的AI助理，经林亦修改后发出。"
    elif accepted_comment["reply_status"] == "rejected":
        if os.path.exists('data/rejected_rpids.txt'):
            with open('data/rejected_rpids.txt', 'a') as f:
                f.write(str(accepted_comment['rpid']) + '\n')
        reply = "云若给出了一个不恰当的回复，已记录。谢谢你帮忙找了个漏洞出来！\n--来自林亦"
    
    # Append the 'rpid' to the processed_rpids.txt
    PROCESSED_RPID_SET.add(accepted_comment['rpid'])

    with open('data/processed_rpids.txt', 'a') as f:
        f.write(str(accepted_comment['rpid']) + '\n')
    
    if DEBUG:
        print(accepted_comment['rpid'])
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
