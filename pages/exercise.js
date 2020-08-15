import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Steps, Divider, notification, Button, Form } from 'antd';
import StepBasic from '../components/exercise/StepBasic';
import StepTestCases from '../components/exercise/StepTestCase';
import StepSnippet from '../components/exercise/StepSnippet';
import StepReview from '../components/exercise/StepReview';
import Header from '../components/Header';
import Footer from '../components/Footer';
import composedAuthHOC from 'hocs';
import axios from 'axios';
import { Router, useRouter } from 'next/router';

const StepTitles = [
  { key: 0, title: 'Basic Informations' },
  { key: 1, title: 'Code Stubs' },
  { key: 2, title: 'Testcases' },
  { key: 3, title: 'Review' },
];

const Exercise = ({
  id,
  userInfo,
  exerciseInfos,
  listTags,
  listLanguages,
  listTeachers,
}) => {
  let router = useRouter();
  let currUserId = userInfo ? userInfo.id : 0;
  // steps
  let [currStep, setCurrStep] = useState(0);
  // step basic infos
  let [formRef] = Form.useForm();
  let [basicInfos, setBasicInfos] = useState(exerciseInfos.basicInfos);
  // step code stubs
  let [languages, setLanguages] = useState(listLanguages);
  // step testcases
  let [testcases, setTestcases] = useState(exerciseInfos.testcases);
  // step reivew
  let [selectedReviewers, setSelectedReviewers] = useState(
    exerciseInfos.selectedReviewers
  );
  // loading
  let [nextLoading, setNextLoading] = useState(false);
  let [prevLoading, setPrevLoading] = useState(false);

  const validateStepBasicInfos = async () => {
    try {
      await formRef.validateFields();
      return true;
    } catch (e) {
      notification.warn({
        message: 'Please check your input again.',
      });
      return false;
    }
  };

  const validateStepCodeStubs = () => {
    if (languages.filter((t) => t.isActive).length === 0) {
      notification.warn({
        message: 'Exercise must support at least ONE language.',
      });
      return false;
    }
    return true;
  };

  const validateStepTestcases = () => {
    if (testcases.length === 0) {
      notification.warn({
        message: 'Exercise must have at least ONE test case.',
      });
      return false;
    }
    return true;
  };

  const validateStepReview = () => {
    if (selectedReviewers.length === 0) {
      notification.warn({
        message: 'Exercise must have at least ONE reviewer.',
      });
      return false;
    }
    return true;
  };

  const onNext = async () => {
    switch (currStep) {
      case 0:
        return (await validateStepBasicInfos()) && setCurrStep(1);
      case 1:
        return validateStepCodeStubs() && setCurrStep(2);
      case 2:
        return validateStepTestcases() && setCurrStep(3);
      case 3:
        return validateStepReview() && (await onFinish());
    }
  };

  const onPrevious = () => {
    setPrevLoading(true);
    setCurrStep(currStep - 1);
    setPrevLoading(false);
  };

  const onFinish = async () => {
    setNextLoading(true);
    try {
      let { content, title, points, level, tags } = basicInfos;
      let res = await axios.post(
        `${process.env.API}/api/exercise/${!id ? 'create' : 'update'}`,
        {
          id: id,
          content: content,
          title: title,
          points: points,
          level: level,
          tags: tags,
          testcases: testcases,
          languages: languages,
          reviewerIds: listTeachers
            .filter((t) => selectedReviewers.indexOf(t.email) !== -1)
            .map((t) => t.id),
          createdBy: currUserId,
        }
      );
      setNextLoading(false);
      if (res.data.success) {
        router.push('/exercise-list', '/exercise-list');
      } else {
        throw new Error();
      }
    } catch (e) {
      notification.warn({
        message: 'Something is wrong.',
      });
      console.log(e);
      setNextLoading(false);
    }
  };

  return (
    <React.Fragment>
      <Head>
        <title>{!id ? 'Create Exercise' : 'Update Exercise'}</title>
      </Head>
      <Header />
      <div
        style={{
          width: '95%',
          margin: '0 auto',
          marginBottom: 50,
          marginTop: 50,
        }}>
        <Divider />
        <Steps current={currStep}>
          {StepTitles.map((t) => (
            <Steps.Step
              title={t.title}
              key={t.key}
              style={{
                fontSize: 17,
              }}
            />
          ))}
        </Steps>
        <Divider />
        <div
          className='step-contents'
          style={{
            marginBottom: '50px',
          }}>
          {currStep === 0 && (
            <StepBasic
              isCreate={!id}
              allTags={listTags}
              formRef={formRef}
              setBasicInfos={setBasicInfos}
              initialValues={exerciseInfos.basicInfos}
            />
          )}
          {currStep === 1 && (
            <StepSnippet languages={languages} setLanguages={setLanguages} />
          )}
          {currStep === 2 && (
            <StepTestCases testcases={testcases} setTestCases={setTestcases} />
          )}
          {currStep === 3 && (
            <StepReview
              listTeachers={listTeachers}
              selectedReviewers={selectedReviewers}
              setSelectedReviewers={setSelectedReviewers}
            />
          )}
        </div>
        <div
          className='step-actions'
          style={{
            display: 'flex',
            justifyContent: currStep === 0 ? 'flex-end' : 'space-between',
            marginBottom: '50px',
          }}>
          {currStep !== 0 && (
            <Button
              loading={prevLoading}
              onClick={onPrevious}
              type='primary'
              size='large'
              style={{
                width: 100,
              }}>
              Previous
            </Button>
          )}
          <Button
            loading={nextLoading}
            onClick={onNext}
            type='primary'
            size='large'
            style={{
              width: 100,
            }}>
            {currStep === StepTitles.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
      <Footer />
    </React.Fragment>
  );
};

Exercise.getInitialProps = async ({ query, store }) => {
  let { id } = query;
  let exerciseInfos = {
    basicInfos: {
      title: '',
      content: '',
      level: 'easy',
      points: 1,
      tags: ['#'],
    },
    testcases: [],
    selectedReviewers: [],
  };
  let listTags = (
    await axios.get(`${process.env.API}/api/tags/all`)
  ).data.data.map((t) => t.name);
  let listLanguages = [];
  let listTeachers = (
    await axios.get(`${process.env.API}/api/user/teacher/all`)
  ).data.data;
  // have 'id' mean edit page is access, get old data
  if (id) {
    let basicInfos = (
      await axios.get(`${process.env.API}/api/exercise/basic-info/${id}`)
    ).data.data;
    exerciseInfos.basicInfos = {
      ...basicInfos,
      tags: [
        '#',
        ...basicInfos.tags.map((t) => t.name).filter((t) => t !== '#'),
      ],
    };
    exerciseInfos.testcases = (
      await axios.get(`${process.env.API}/api/testcase/exercise/${id}`)
    ).data.data.result.map((t) => ({
      key: t.id,
      id: t.id,
      input: t.input,
      output: t.expectedOutput,
      isHidden: t.isHidden,
    }));
    listLanguages = (
      await axios.get(`${process.env.API}/api/language/exercise/${id}`)
    ).data.data.map((t) => ({
      key: t.id,
      id: t.id,
      language: t.name,
      isActive: t.codeSnippets.length ? t.codeSnippets[0].isActive : false,
      sampleCode: t.codeSnippets.length ? t.codeSnippets[0].sampleCode : '',
    }));
    let selectedReviewerIds = (
      await axios.get(`${process.env.API}/api/review/request/${id}`)
    ).data.data[0].details.map((t) => t.reviewer);
    exerciseInfos.selectedReviewers = [...listTeachers]
      .filter((t) => selectedReviewerIds.indexOf(t.id) !== -1)
      .map((t) => t.email);
  } else {
    listLanguages = (
      await axios.get(`${process.env.API}/api/language/all`)
    ).data.data.map((t, index) => ({
      key: t.id,
      id: t.id,
      language: t.name,
      isActive: index === 0 ? true : false,
      sampleCode: '',
    }));
  }
  return {
    id: id,
    exerciseInfos,
    listTags,
    listLanguages,
    listTeachers,
  };
};

export default composedAuthHOC(Exercise);
