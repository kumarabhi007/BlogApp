import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';
const app = express();


app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/build')));

//############### Refactoring ##################

const withDB = async (operation, res)=>{
    try{
        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser : true});
        const db = client.db('my-blog');
        await operation(db);
    
        client.close();
    

    }catch(error){
        res.status(500).json({ message: 'Something went wrong in the server side', error});

    }


}

app.get('/api/article/:name', async (req, res)=>{

        withDB(async (db)=>{
            const articleName = req.params.name;
            const articleInfo = await db.collection('articles').findOne({name: articleName});
            res.status(200).json(articleInfo);
        }, res)       
    
})

app.post('/api/article/:name/upvote', async (req, res)=>{

    withDB(async (db)=>{
        let articleName = req.params.name;    

        const article = await db.collection('articles').findOne({ name: articleName });
    
        await db.collection('articles').updateOne({name: articleName}, {$set: {upvote: article.upvote + 1}});
        const updatedArticle = await db.collection('articles').findOne({ name: articleName });
    
        res.status(200).json(updatedArticle);
    }, res);
    
});

app.post('/api/article/:name/downvote', async (req, res)=>{
    withDB(async (db)=>{
        let articleName = req.params.name;    

        const article = await db.collection('articles').findOne({ name: articleName });
    
        await db.collection('articles').updateOne({name: articleName}, {$set: {upvote: article.upvote - 1}});
        const updatedArticle = await db.collection('articles').findOne({ name: articleName });
    
        res.status(200).json(updatedArticle);
    }, res);

})


app.post('/api/article/:name/add-comment', async (req, res)=>{
    const { username, comment } = req.body;
    const articleName = req.params.name;

    withDB(async (db)=>{
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, { $set: {comment: articleInfo.comment.concat({ username, comment })}});
        const updatedArticle = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticle);

    }, res)
 
});

app.get('*', (req, res)=>{
    res.sendFile(path.join(__dirname + '/build/index.html'));
})


app.listen(8000, ()=> console.log('server listening on port 8000'));