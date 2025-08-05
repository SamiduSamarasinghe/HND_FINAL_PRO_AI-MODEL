import { Card, CardContent, List, ListItem, ListItemText, Typography } from '@mui/material';
import { InsertDriveFileOutlined } from '@mui/icons-material';

const RecentPapers = ({ papers }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Recently Uploaded Papers
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Papers you've uploaded for analysis
                </Typography>

                <List>
                    {papers.map((paper, index) => (
                        <ListItem key={index}>
                            <InsertDriveFileOutlined sx={{ mr: 2 }} />
                            <ListItemText
                                primary={paper.title}
                                secondary={`${paper.questions} questions • ${paper.date}`}
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};

export default RecentPapers;